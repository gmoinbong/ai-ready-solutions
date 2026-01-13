import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { SessionStatus } from "../types";
import type {
  VoiceAgentConfig,
  VoiceAgentCallbacks,
} from "../types";
import { createPcmBlob, decode, decodeAudioData } from "../utils/audioUtils";

export class VoiceAgent {
  private config: VoiceAgentConfig;
  private callbacks: VoiceAgentCallbacks;
  private session: any = null;
  private audioContexts: { input: AudioContext; output: AudioContext } | null =
    null;
  private nextStartTime = 0;
  private audioSources = new Set<AudioBufferSourceNode>();
  private transcription = { user: "", model: "" };
  private status: SessionStatus = SessionStatus.IDLE;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private isClosing: boolean = false;

  constructor(config: VoiceAgentConfig, callbacks: VoiceAgentCallbacks = {}) {
    this.config = {
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      voiceName: "Kore",
      inputSampleRate: 16000,
      outputSampleRate: 24000,
      ...config,
    };
    this.callbacks = callbacks;
  }

  private setStatus(status: SessionStatus) {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private async initAudioContexts() {
    if (!this.audioContexts) {
      this.audioContexts = {
        input: new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: this.config.inputSampleRate,
        }),
        output: new (window.AudioContext || (window as any).webkitAudioContext)(
          {
            sampleRate: this.config.outputSampleRate,
          }
        ),
      };
    }

    if (this.audioContexts.input.state === "suspended") {
      await this.audioContexts.input.resume();
    }
    if (this.audioContexts.output.state === "suspended") {
      await this.audioContexts.output.resume();
    }
  }

  private stopAllAudio() {
    this.audioSources.forEach((source) => {
      try {
        source.stop();
      } catch (e: unknown) {
        // Ignore errors when stopping already stopped sources
      }
    });
    this.audioSources.clear();
    this.nextStartTime = 0;
  }

  async start() {
    try {
      // Stop any existing session first
      if (this.session && !this.isClosing) {
        await this.stop();
      }
      
      this.isClosing = false;
      this.setStatus(SessionStatus.CONNECTING);
      await this.initAudioContexts();

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });

      const sessionPromise = ai.live.connect({
        model: this.config.model!,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: this.config.voiceName },
            },
          },
          systemInstruction: this.config.systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            this.setStatus(SessionStatus.ACTIVE);
            this.setupMicrophoneCapture();
          },
          onmessage: async (message: LiveServerMessage) => {
            await this.handleMessage(message);
          },
          onerror: (e) => {
            console.error("VoiceAgent Error:", e);
            this.isClosing = false;
            this.setStatus(SessionStatus.ERROR);
            this.callbacks.onError?.(new Error(String(e)));
          },
          onclose: () => {
            this.isClosing = false;
            this.setStatus(SessionStatus.IDLE);
            this.callbacks.onAudioEnd?.();
          },
        },
      });

      this.session = await sessionPromise;
    } catch (err) {
      console.error("Failed to start VoiceAgent:", err);
      this.setStatus(SessionStatus.ERROR);
      this.callbacks.onError?.(
        err instanceof Error ? err : new Error(String(err))
      );
    }
  }

  private setupMicrophoneCapture() {
    if (!this.audioContexts || !this.mediaStream) return;

    const source = this.audioContexts.input.createMediaStreamSource(
      this.mediaStream
    );
    this.scriptProcessor = this.audioContexts.input.createScriptProcessor(
      4096,
      1,
      1
    );

    this.scriptProcessor.onaudioprocess = (e) => {
      if (this.isClosing || !this.session || this.status !== SessionStatus.ACTIVE) {
        return;
      }
      
      try {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        if (this.session && !this.isClosing) {
          this.session.sendRealtimeInput({ media: pcmBlob });
        }
      } catch (err) {
        // Ignore errors when session is closing
        if (!this.isClosing) {
          console.warn("Error sending audio data:", err);
        }
      }
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContexts.input.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // Don't process messages if closing
    if (this.isClosing || this.status !== SessionStatus.ACTIVE) {
      return;
    }

    // Audio Output Handling
    const audioData =
      message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.audioContexts && !this.isClosing) {
      this.callbacks.onAudioStart?.();
      const outputCtx = this.audioContexts.output;
      this.nextStartTime = Math.max(this.nextStartTime, outputCtx.currentTime);

      const buffer = await decodeAudioData(
        decode(audioData),
        outputCtx,
        this.config.outputSampleRate!,
        1
      );
      const source = outputCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(outputCtx.destination);

      source.onended = () => {
        this.audioSources.delete(source);
        if (this.audioSources.size === 0) {
          this.callbacks.onAudioEnd?.();
        }
      };

      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
      this.audioSources.add(source);
    }

    // Interruption Handling
    if (message.serverContent?.interrupted) {
      this.stopAllAudio();
      this.callbacks.onAudioEnd?.();
    }

    // Transcription Handling
    if (message.serverContent?.inputTranscription) {
      this.transcription.user += message.serverContent.inputTranscription.text;
    }
    if (message.serverContent?.outputTranscription) {
      this.transcription.model +=
        message.serverContent.outputTranscription.text;
    }

    if (message.serverContent?.turnComplete) {
      const userText = this.transcription.user;
      const assistantText = this.transcription.model;

      if (userText) {
        this.callbacks.onMessage?.({
          role: "user",
          text: userText,
          timestamp: new Date(),
        });
      }
      if (assistantText) {
        this.callbacks.onMessage?.({
          role: "assistant",
          text: assistantText,
          timestamp: new Date(),
        });
      }

      this.transcription = { user: "", model: "" };
    }
  }

  stop() {
    if (this.isClosing) {
      return;
    }

    this.isClosing = true;

    // Stop script processor first to prevent sending more data
    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch (e) {
        // Ignore errors
      }
      this.scriptProcessor = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            // Ignore errors
          }
        });
      } catch (e) {
        // Ignore errors
      }
      this.mediaStream = null;
    }

    // Stop all audio playback
    this.stopAllAudio();

    // Close session last
    if (this.session) {
      try {
        // Check if session has a readyState property (WebSocket-like)
        if (this.session.readyState !== undefined) {
          const readyState = this.session.readyState;
          // 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
          if (readyState === 1) { // OPEN
            this.session.close();
          }
        } else {
          // Try to close anyway, catch errors
          this.session.close();
        }
      } catch (err) {
        // Ignore errors when closing already closed session
        console.warn("Error closing session:", err);
      }
      this.session = null;
    }

    this.setStatus(SessionStatus.IDLE);
    this.isClosing = false;
  }

  getStatus(): SessionStatus {
    return this.status;
  }

  updateConfig(config: Partial<VoiceAgentConfig>) {
    this.config = { ...this.config, ...config };
  }

  updateCallbacks(callbacks: Partial<VoiceAgentCallbacks>) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}

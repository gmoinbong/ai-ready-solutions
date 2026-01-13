import { GoogleGenAI } from "@google/genai";
import { TranscriptionStatus } from "../types";
import type {
  TranscriptionConfig,
  TranscriptionCallbacks,
} from "../types";

export class TranscriptionService {
  private config: TranscriptionConfig;
  private callbacks: TranscriptionCallbacks;
  private status: TranscriptionStatus = TranscriptionStatus.IDLE;

  constructor(
    config: TranscriptionConfig,
    callbacks: TranscriptionCallbacks = {}
  ) {
    this.config = {
      model: "gemini-3-flash-preview",
      ...config,
    };
    this.callbacks = callbacks;
  }

  private setStatus(status: TranscriptionStatus) {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  async transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
    try {
      this.setStatus(TranscriptionStatus.TRANSCRIBING);
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });

      const response = await ai.models.generateContent({
        model: this.config.model!,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
            {
              text: "Transcribe the provided audio into text. Provide only the transcription, no preamble or extra comments. If the audio is empty or unclear, say 'No clear audio detected'.",
            },
          ],
        },
      });

      const text = response.text || "No transcription available.";
      this.setStatus(TranscriptionStatus.COMPLETED);
      this.callbacks.onTranscriptionComplete?.(text);
      return text;
    } catch (error) {
      console.error("Transcription error:", error);
      this.setStatus(TranscriptionStatus.ERROR);
      const errorMessage =
        error instanceof Error
          ? error
          : new Error("Failed to transcribe audio. Please try again.");
      this.callbacks.onError?.(errorMessage);
      throw errorMessage;
    }
  }

  getStatus(): TranscriptionStatus {
    return this.status;
  }

  updateConfig(config: Partial<TranscriptionConfig>) {
    this.config = { ...this.config, ...config };
  }

  updateCallbacks(callbacks: Partial<TranscriptionCallbacks>) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}

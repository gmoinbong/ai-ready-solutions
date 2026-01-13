import { useState, useRef, useCallback, useEffect } from "react";
import { TranscriptionService } from "../core/TranscriptionService";
import { TranscriptionStatus } from "../types";
import type {
  TranscriptionConfig,
  TranscriptionCallbacks,
} from "../types";
import { blobToBase64 } from "../utils/audioUtils";

export interface UseTranscriptionOptions extends TranscriptionConfig {
  callbacks?: TranscriptionCallbacks;
}

export interface UseTranscriptionReturn {
  status: TranscriptionStatus;
  transcription: string;
  error: string | null;
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  transcribeAudio: (blob: Blob) => Promise<void>;
  clearTranscription: () => void;
}

export function useTranscription(
  options: UseTranscriptionOptions
): UseTranscriptionReturn {
  const [status, setStatus] = useState<TranscriptionStatus>(
    TranscriptionStatus.IDLE
  );
  const [transcription, setTranscription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const serviceRef = useRef<TranscriptionService | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStatusChange = useCallback((newStatus: TranscriptionStatus) => {
    setStatus(newStatus);
  }, []);

  const handleTranscriptionComplete = useCallback((text: string) => {
    setTranscription(text);
  }, []);

  const handleError = useCallback((error: Error) => {
    setError(error.message);
  }, []);

  useEffect(() => {
    const callbacks: TranscriptionCallbacks = {
      onStatusChange: handleStatusChange,
      onTranscriptionComplete: handleTranscriptionComplete,
      onError: handleError,
      ...options.callbacks,
    };

    serviceRef.current = new TranscriptionService(options, callbacks);

    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [
    options.apiKey,
    options.model,
    handleStatusChange,
    handleTranscriptionComplete,
    handleError,
    options.callbacks,
  ]);

  const transcribeAudio = useCallback(
    async (blob: Blob) => {
      if (!serviceRef.current) return;

      try {
        setError(null);
        const base64Audio = await blobToBase64(blob);
        await serviceRef.current.transcribeAudio(base64Audio, "audio/webm");
      } catch (err: any) {
        setError(err.message || "An error occurred during transcription.");
      }
    },
    []
  );

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus(TranscriptionStatus.RECORDING);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Could not access microphone. Please check permissions.");
      setStatus(TranscriptionStatus.ERROR);
    }
  }, [transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const clearTranscription = useCallback(() => {
    setTranscription("");
    setError(null);
    setStatus(TranscriptionStatus.IDLE);
  }, []);

  return {
    status,
    transcription,
    error,
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    transcribeAudio,
    clearTranscription,
  };
}

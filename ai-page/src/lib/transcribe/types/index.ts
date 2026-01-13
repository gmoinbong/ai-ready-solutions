const TranscriptionStatusValues = {
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  TRANSCRIBING: 'TRANSCRIBING',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
} as const;

export const TranscriptionStatus = TranscriptionStatusValues;
export type TranscriptionStatus = (typeof TranscriptionStatusValues)[keyof typeof TranscriptionStatusValues];

export interface TranscriptionConfig {
  apiKey: string;
  model?: string;
}

export interface TranscriptionCallbacks {
  onStatusChange?: (status: TranscriptionStatus) => void;
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: Error) => void;
}

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SessionStatusValues = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  ACTIVE: 'ACTIVE',
  ERROR: 'ERROR'
} as const;

export const SessionStatus = SessionStatusValues;
export type SessionStatus = (typeof SessionStatusValues)[keyof typeof SessionStatusValues];

export interface VoiceAgentConfig {
  apiKey: string;
  model?: string;
  systemInstruction: string;
  voiceName?: string;
  inputSampleRate?: number;
  outputSampleRate?: number;
}

export interface VoiceAgentCallbacks {
  onStatusChange?: (status: SessionStatus) => void;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

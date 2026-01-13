export interface TableData {
  title: string;
  headers: string[];
  rows: string[][];
  explanation?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  table?: TableData;
}

const GenerationStatusValues = {
  IDLE: "IDLE",
  GENERATING: "GENERATING",
  COMPLETED: "COMPLETED",
  ERROR: "ERROR",
} as const;

export const GenerationStatus = GenerationStatusValues;
export type GenerationStatus = (typeof GenerationStatusValues)[keyof typeof GenerationStatusValues];

export interface CSVGenerationConfig {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
}

export interface CSVGenerationCallbacks {
  onStatusChange?: (status: GenerationStatus) => void;
  onDataGenerated?: (data: TableData) => void;
  onError?: (error: Error) => void;
}

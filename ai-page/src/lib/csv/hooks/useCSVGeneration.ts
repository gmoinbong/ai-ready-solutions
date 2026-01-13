import { useState, useRef, useCallback, useEffect } from "react";
import { CSVGenerationService } from "../core/CSVGenerationService";
import { GenerationStatus } from "../types";
import type {
  CSVGenerationConfig,
  CSVGenerationCallbacks,
  Message,
  TableData,
} from "../types";

export interface UseCSVGenerationOptions extends CSVGenerationConfig {
  callbacks?: CSVGenerationCallbacks;
}

export interface UseCSVGenerationReturn {
  status: GenerationStatus;
  messages: Message[];
  isLoading: boolean;
  generateData: (prompt: string) => Promise<void>;
  clearMessages: () => void;
}

export function useCSVGeneration(
  options: UseCSVGenerationOptions
): UseCSVGenerationReturn {
  const [status, setStatus] = useState<GenerationStatus>(
    GenerationStatus.IDLE
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const serviceRef = useRef<CSVGenerationService | null>(null);

  const handleStatusChange = useCallback((newStatus: GenerationStatus) => {
    setStatus(newStatus);
    setIsLoading(newStatus === GenerationStatus.GENERATING);
  }, []);

  const handleDataGenerated = useCallback((data: TableData) => {
    const assistantMessage: Message = {
      role: "assistant",
      content: `I've generated the data you requested: **${data.title}**. You can view it below and download it as a CSV file.`,
      table: data,
    };
    setMessages((prev) => [...prev, assistantMessage]);
  }, []);

  const handleError = useCallback(() => {
    const errorMessage: Message = {
      role: "assistant",
      content:
        "Sorry, I encountered an error while generating the data. Please try again.",
    };
    setMessages((prev) => [...prev, errorMessage]);
  }, []);

  useEffect(() => {
    const callbacks: CSVGenerationCallbacks = {
      onStatusChange: handleStatusChange,
      onDataGenerated: handleDataGenerated,
      onError: handleError,
      ...options.callbacks,
    };

    serviceRef.current = new CSVGenerationService(options, callbacks);
  }, [
    options.apiKey,
    options.model,
    options.systemInstruction,
    handleStatusChange,
    handleDataGenerated,
    handleError,
    options.callbacks,
  ]);

  const generateData = useCallback(
    async (prompt: string) => {
      if (!serviceRef.current || !prompt.trim() || isLoading) return;

      const userMessage: Message = { role: "user", content: prompt };
      setMessages((prev) => [...prev, userMessage]);

      try {
        await serviceRef.current.generateCSVData(prompt);
      } catch (error) {
        console.error(error);
      }
    },
    [isLoading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus(GenerationStatus.IDLE);
  }, []);

  return {
    status,
    messages,
    isLoading,
    generateData,
    clearMessages,
  };
}

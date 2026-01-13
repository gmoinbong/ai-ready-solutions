import { GoogleGenAI, Type } from "@google/genai";
import { GenerationStatus } from "../types";
import type {
  CSVGenerationConfig,
  CSVGenerationCallbacks,
  TableData,
} from "../types";

export class CSVGenerationService {
  private config: CSVGenerationConfig;
  private callbacks: CSVGenerationCallbacks;
  private status: GenerationStatus = GenerationStatus.IDLE;

  constructor(
    config: CSVGenerationConfig,
    callbacks: CSVGenerationCallbacks = {}
  ) {
    this.config = {
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional data analyst. 
      When a user asks for data, a list, or a table, you must generate it in a structured JSON format.
      Provide a concise explanation of the data context.
      Ensure the data is realistic and well-formatted.`,
      ...config,
    };
    this.callbacks = callbacks;
  }

  private setStatus(status: GenerationStatus) {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  async generateCSVData(prompt: string): Promise<TableData> {
    try {
      this.setStatus(GenerationStatus.GENERATING);
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });

      const response = await ai.models.generateContent({
        model: this.config.model!,
        contents: prompt,
        config: {
          systemInstruction: this.config.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "A descriptive title for the generated table.",
              },
              headers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The column headers for the table.",
              },
              rows: {
                type: Type.ARRAY,
                items: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                description: "The data rows for the table.",
              },
              explanation: {
                type: Type.STRING,
                description:
                  "A brief explanation of what this data represents.",
              },
            },
            required: ["title", "headers", "rows"],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      const data = JSON.parse(text) as TableData;
      this.setStatus(GenerationStatus.COMPLETED);
      this.callbacks.onDataGenerated?.(data);
      return data;
    } catch (error) {
      console.error("CSV Generation error:", error);
      this.setStatus(GenerationStatus.ERROR);
      const errorMessage =
        error instanceof Error
          ? error
          : new Error("Failed to generate CSV data. Please try again.");
      this.callbacks.onError?.(errorMessage);
      throw errorMessage;
    }
  }

  getStatus(): GenerationStatus {
    return this.status;
  }

  updateConfig(config: Partial<CSVGenerationConfig>) {
    this.config = { ...this.config, ...config };
  }

  updateCallbacks(callbacks: Partial<CSVGenerationCallbacks>) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}

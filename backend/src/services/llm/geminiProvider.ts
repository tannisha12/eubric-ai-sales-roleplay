import { ApiError, GoogleGenAI, type Content } from "@google/genai";
import type { HttpError } from "../../types/http";
import type { LlmMessage, LlmProvider } from "./llmProvider";

const MODEL = "gemini-flash-latest";

function httpError(message: string, statusCode: number): HttpError {
  const error: HttpError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function mapGeminiError(err: unknown): HttpError {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return httpError("The AI service is not configured correctly.", 500);
    }
    if (err.status === 429) {
      return httpError(
        "The AI service is receiving too many requests right now. Please try again shortly.",
        429
      );
    }
    return httpError("The AI service returned an unexpected error.", err.status || 502);
  }

  if (err instanceof TypeError) {
    return httpError(
      "Could not reach the AI service. Please check your connection and try again.",
      503
    );
  }

  return httpError("Unexpected error while generating a reply.", 500);
}

function toGeminiContents(messages: LlmMessage[]): Content[] {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

export class GeminiProvider implements LlmProvider {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateReply(systemPrompt: string, messages: LlmMessage[]): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: MODEL,
        contents: toGeminiContents(messages),
        config: {
          systemInstruction: systemPrompt,
        },
      });

      const text = response.text;

      if (!text) {
        throw httpError("The AI service returned an unexpected response format.", 502);
      }

      return text;
    } catch (err) {
      if ((err as HttpError).statusCode) {
        throw err;
      }
      throw mapGeminiError(err);
    }
  }
}

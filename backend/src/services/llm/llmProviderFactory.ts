import { env } from "../../config/env";
import type { HttpError } from "../../types/http";
import { GeminiProvider } from "./geminiProvider";
import type { LlmProvider } from "./llmProvider";

let cachedProvider: LlmProvider | null = null;

export function getLlmProvider(): LlmProvider {
  if (!cachedProvider) {
    if (!env.geminiApiKey) {
      const error: HttpError = new Error(
        "The AI service is not configured. Set GEMINI_API_KEY in the environment."
      );
      error.statusCode = 500;
      throw error;
    }
    cachedProvider = new GeminiProvider(env.geminiApiKey);
  }
  return cachedProvider;
}

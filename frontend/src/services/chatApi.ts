import type { ChatMessage } from "../components/ChatWindow";
import type { PersonaConfig } from "../types/persona";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface ChatApiRequest {
  message: string;
  conversationHistory: ChatMessage[];
  persona: PersonaConfig;
}

interface ChatApiResponse {
  reply: string;
}

export class ChatApiError extends Error {}

function extractErrorMessage(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message?: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }
  return "The server returned an error. Please try again.";
}

export async function sendChatMessage(
  request: ChatApiRequest,
  signal?: AbortSignal
): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch {
    throw new ChatApiError("Could not reach the server. Check your connection and try again.");
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ChatApiError("Received an unreadable response from the server.");
  }

  if (!response.ok) {
    throw new ChatApiError(extractErrorMessage(data));
  }

  if (
    typeof data !== "object" ||
    data === null ||
    typeof (data as ChatApiResponse).reply !== "string"
  ) {
    throw new ChatApiError("The server returned an unexpected response.");
  }

  return (data as ChatApiResponse).reply;
}

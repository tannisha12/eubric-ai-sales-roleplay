import type { ChatMessage } from "../components/ChatWindow";
import type { CoachingReport } from "../types/coachingReport";
import type { PersonaConfig } from "../types/persona";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export class CoachingReportApiError extends Error {}

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

export async function fetchCoachingReport(
  conversationHistory: ChatMessage[],
  persona: PersonaConfig,
  signal?: AbortSignal
): Promise<CoachingReport> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/coaching-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationHistory, persona }),
      signal,
    });
  } catch {
    throw new CoachingReportApiError(
      "Could not reach the server. Check your connection and try again."
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new CoachingReportApiError("Received an unreadable response from the server.");
  }

  if (!response.ok) {
    throw new CoachingReportApiError(extractErrorMessage(data));
  }

  return data as CoachingReport;
}

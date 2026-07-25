import type { PersonaConfig } from "../types/persona";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface RandomPersonaResponse {
  persona: PersonaConfig;
  opening: string;
}

export class PersonaApiError extends Error {}

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

export async function fetchRandomPersona(signal?: AbortSignal): Promise<RandomPersonaResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/persona/random`, { signal });
  } catch {
    throw new PersonaApiError("Could not reach the server. Check your connection and try again.");
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new PersonaApiError("Received an unreadable response from the server.");
  }

  if (!response.ok) {
    throw new PersonaApiError(extractErrorMessage(data));
  }

  if (
    typeof data !== "object" ||
    data === null ||
    typeof (data as RandomPersonaResponse).opening !== "string" ||
    typeof (data as RandomPersonaResponse).persona !== "object"
  ) {
    throw new PersonaApiError("The server returned an unexpected response.");
  }

  return data as RandomPersonaResponse;
}

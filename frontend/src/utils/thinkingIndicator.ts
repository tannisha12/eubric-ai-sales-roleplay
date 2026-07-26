import type { PersonaConfig } from "../types/persona";

// How long the AI "thinks" before its reply appears, so responses don't feel instant.
const MIN_THINKING_DELAY_MS = 800;
const MAX_THINKING_DELAY_MS = 1200;

/** A random delay within the natural-thinking window - not fixed, so every reply feels a little different. */
export function randomThinkingDelayMs(): number {
  return MIN_THINKING_DELAY_MS + Math.random() * (MAX_THINKING_DELAY_MS - MIN_THINKING_DELAY_MS);
}

/** Non-blocking wait: resolves after `ms`, without freezing the UI thread. */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** "Daniel is thinking..." when the persona has a name, else a generic fallback. */
export function getThinkingLabel(persona: PersonaConfig): string {
  const firstName = persona.name?.trim().split(/\s+/)[0];
  return firstName ? `${firstName} is thinking...` : "AI is thinking...";
}

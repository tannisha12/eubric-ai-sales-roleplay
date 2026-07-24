import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../components/ChatWindow";

export type SessionState = "idle" | "listening" | "thinking" | "speaking";

const INITIAL_TRANSCRIPT: ChatMessage[] = [
  { sender: "ai", text: "Hello! I'm interested in your product." },
  { sender: "user", text: "Hi, thanks for your time." },
  { sender: "ai", text: "Can you explain pricing?" },
];

interface SimulatedStep {
  delayMs: number;
  state: SessionState;
  message?: string;
}

const SIMULATED_FLOW: SimulatedStep[] = [
  { delayMs: 2000, state: "thinking" },
  {
    delayMs: 4000,
    state: "speaking",
    message: "Thanks for taking the time to speak with me today.",
  },
  {
    delayMs: 6000,
    state: "listening",
    message: "Can you tell me a bit about your current sales process?",
  },
];

export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcript, setTranscript] = useState<ChatMessage[]>(INITIAL_TRANSCRIPT);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const startSession = useCallback(() => {
    clearTimers();
    setIsSessionActive(true);
    setSessionState("listening");
    setTranscript(INITIAL_TRANSCRIPT);

    SIMULATED_FLOW.forEach(({ delayMs, state, message }) => {
      const timeoutId = setTimeout(() => {
        setSessionState(state);
        if (message) {
          setTranscript((prev) => [...prev, { sender: "ai", text: message }]);
        }
      }, delayMs);
      timeoutsRef.current.push(timeoutId);
    });
  }, [clearTimers]);

  const endSession = useCallback(() => {
    clearTimers();
    setIsSessionActive(false);
    setSessionState("idle");
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    sessionState,
    isSessionActive,
    transcript,
    startSession,
    endSession,
  };
}

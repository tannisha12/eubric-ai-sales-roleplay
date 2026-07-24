import { useCallback, useState } from "react";

export type SessionState = "idle" | "listening" | "thinking" | "speaking";

export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [isSessionActive, setIsSessionActive] = useState(false);

  const startSession = useCallback(() => {
    setIsSessionActive(true);
    setSessionState("listening");
  }, []);

  const endSession = useCallback(() => {
    setIsSessionActive(false);
    setSessionState("idle");
  }, []);

  return {
    sessionState,
    isSessionActive,
    startSession,
    endSession,
  };
}

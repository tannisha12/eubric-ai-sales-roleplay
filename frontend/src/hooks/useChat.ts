import { useCallback, useState } from "react";
import type { ChatMessage } from "../components/ChatWindow";
import { ChatApiError, sendChatMessage } from "../services/chatApi";
import type { PersonaConfig } from "../types/persona";

const DEFAULT_PERSONA: PersonaConfig = {
  name: "Healthcare CTO",
  role: "Chief Technology Officer",
  industry: "Healthcare",
  companySize: "Enterprise (1000+ employees)",
  budget: "Constrained, requires a clear ROI case before approving new spend",
  decisionStyle: "Data-driven, consults the technical team before deciding",
  objectionStyle: "Raises security, compliance, and integration concerns",
  communicationStyle: "Direct, technical, time-conscious",
  difficulty: "Medium",
};

const INITIAL_MESSAGES: ChatMessage[] = [
  { sender: "ai", text: "Hello! I'm interested in your product." },
];

export function useChat(persona: PersonaConfig = DEFAULT_PERSONA) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) {
        return;
      }

      setError(null);
      const history = messages;
      setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
      setIsLoading(true);

      try {
        const reply = await sendChatMessage({
          message: trimmed,
          conversationHistory: history,
          persona,
        });
        setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
      } catch (err) {
        const message =
          err instanceof ChatApiError ? err.message : "Something went wrong. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, persona]
  );

  const resetChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setError(null);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, error, sendMessage, resetChat };
}

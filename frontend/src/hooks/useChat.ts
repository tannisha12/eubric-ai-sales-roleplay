import { useCallback, useState } from "react";
import type { ChatMessage } from "../components/ChatWindow";
import { ChatApiError, sendChatMessage } from "../services/chatApi";
import type { PersonaConfig } from "../types/persona";
import { randomThinkingDelayMs, wait } from "../utils/thinkingIndicator";

export const DEFAULT_PERSONA: PersonaConfig = {
  name: "Healthcare CTO",
  role: "Chief Technology Officer",
  industry: "Healthcare",
  companySize: "Enterprise (1000+ employees)",
  budget: "Constrained, requires a clear ROI case before approving new spend",
  decisionStyle: "Data-driven, consults the technical team before deciding",
  objectionStyle: "Raises security, compliance, and integration concerns",
  communicationStyle: "Direct, technical, time-conscious",
  difficulty: "Medium",
  companyName: "Meridian Health Partners",
  mainResponsibilities: "Owns full-cycle recruiting strategy and hiring team performance",
  currentChallenges: "Struggling with a high volume of applicants and slow screening times",
  buyingMotivation: "Was tasked with modernizing the hiring stack this fiscal year",
  painPoints: "Too much recruiter time lost to manual resume screening",
  successMetrics: "Time-to-hire reduced by at least 30%",
  expectedOutcome: "Clear proof of ROI to present at the next budget review",
};

export function useChat(persona: PersonaConfig = DEFAULT_PERSONA) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
        // A brief, randomized "thinking" pause before the reply appears - skipped
        // entirely on error, so failures surface immediately.
        await wait(randomThinkingDelayMs());
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

  const resetChat = useCallback((openingMessage?: string) => {
    setMessages(openingMessage ? [{ sender: "ai", text: openingMessage }] : []);
    setError(null);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, error, sendMessage, resetChat };
}

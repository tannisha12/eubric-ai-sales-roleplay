import { getLlmProvider } from "./llm/llmProviderFactory";
import type { LlmMessage } from "./llm/llmProvider";
import { DEFAULT_PERSONA } from "./persona.service";
import { buildSystemPrompt } from "./promptBuilder.service";
import { deriveBuyerState } from "./buyerState/buyerState.service";
import type { ChatRequestBody, ChatTurn } from "../types/chat";

function toLlmMessages(history: ChatTurn[], latestMessage: string): LlmMessage[] {
  const historyMessages: LlmMessage[] = history.map((turn) => ({
    role: turn.sender === "ai" ? "assistant" : "user",
    content: turn.text,
  }));

  return [...historyMessages, { role: "user", content: latestMessage }];
}

export async function getChatReply(request: ChatRequestBody): Promise<string> {
  const persona = request.persona ?? DEFAULT_PERSONA;
  const conversationHistory = request.conversationHistory ?? [];
  const fullHistory: ChatTurn[] = [...conversationHistory, { sender: "user", text: request.message }];

  const buyerState = deriveBuyerState(fullHistory, persona);
  const systemPrompt = buildSystemPrompt(persona, buyerState);
  const messages = toLlmMessages(conversationHistory, request.message);

  const provider = getLlmProvider();
  return provider.generateReply(systemPrompt, messages);
}

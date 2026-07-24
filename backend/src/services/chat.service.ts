import { getLlmProvider } from "./llm/llmProviderFactory";
import type { LlmMessage } from "./llm/llmProvider";
import { DEFAULT_PERSONA } from "./persona.service";
import { buildSystemPrompt } from "./promptBuilder.service";
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
  const systemPrompt = buildSystemPrompt(persona);
  const messages = toLlmMessages(request.conversationHistory ?? [], request.message);

  const provider = getLlmProvider();
  return provider.generateReply(systemPrompt, messages);
}

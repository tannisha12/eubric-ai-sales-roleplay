import type { PersonaConfig } from "./persona";

export type ChatSender = "user" | "ai";

export interface ChatTurn {
  sender: ChatSender;
  text: string;
}

export interface ChatRequestBody {
  message: string;
  conversationHistory?: ChatTurn[];
  persona?: PersonaConfig;
}

export interface ChatResponseBody {
  reply: string;
}

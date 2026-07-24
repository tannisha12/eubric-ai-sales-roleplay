export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmProvider {
  generateReply(systemPrompt: string, messages: LlmMessage[]): Promise<string>;
}

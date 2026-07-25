export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export type JsonSchemaType = "string" | "number" | "integer" | "boolean" | "array" | "object";

export interface JsonSchema {
  type: JsonSchemaType;
  description?: string;
  enum?: string[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  minimum?: number;
  maximum?: number;
}

export interface LlmProvider {
  generateReply(systemPrompt: string, messages: LlmMessage[]): Promise<string>;
  generateJson<T>(systemPrompt: string, userPrompt: string, schema: JsonSchema): Promise<T>;
}

import fs from "node:fs";
import path from "node:path";
import type { PersonaConfig } from "../types/persona";

const TEMPLATE_PATH = path.resolve(__dirname, "../../../prompts/system-prompt.md");

const PLACEHOLDERS: Record<string, (persona: PersonaConfig) => string> = {
  "{{NAME}}": (persona) => persona.name ?? "the buyer",
  "{{ROLE}}": (persona) => persona.role,
  "{{INDUSTRY}}": (persona) => persona.industry,
  "{{COMPANY_SIZE}}": (persona) => persona.companySize,
  "{{BUDGET}}": (persona) => persona.budget,
  "{{DECISION_STYLE}}": (persona) => persona.decisionStyle,
  "{{OBJECTION_STYLE}}": (persona) => persona.objectionStyle,
  "{{COMMUNICATION_STYLE}}": (persona) => persona.communicationStyle,
  "{{DIFFICULTY}}": (persona) => persona.difficulty,
};

export function buildSystemPrompt(persona: PersonaConfig): string {
  let template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

  for (const [placeholder, resolve] of Object.entries(PLACEHOLDERS)) {
    template = template.split(placeholder).join(resolve(persona));
  }

  return template;
}

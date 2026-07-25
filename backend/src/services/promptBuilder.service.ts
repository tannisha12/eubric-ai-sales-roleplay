import fs from "node:fs";
import path from "node:path";
import type { PersonaConfig } from "../types/persona";

const TEMPLATE_PATH = path.resolve(__dirname, "../../../prompts/system-prompt.md");
const KNOWLEDGE_BASE_PATH = path.resolve(__dirname, "../../../prompts/knowledge/eubric-ai.md");

const KNOWLEDGE_BASE = fs.readFileSync(KNOWLEDGE_BASE_PATH, "utf-8");

const PLACEHOLDERS: Record<string, (persona: PersonaConfig) => string> = {
  "{{KNOWLEDGE_BASE}}": () => KNOWLEDGE_BASE,
  "{{NAME}}": (persona) => persona.name ?? "the buyer",
  "{{ROLE}}": (persona) => persona.role,
  "{{INDUSTRY}}": (persona) => persona.industry,
  "{{COMPANY_SIZE}}": (persona) => persona.companySize,
  "{{BUDGET}}": (persona) => persona.budget,
  "{{DECISION_STYLE}}": (persona) => persona.decisionStyle,
  "{{OBJECTION_STYLE}}": (persona) => persona.objectionStyle,
  "{{COMMUNICATION_STYLE}}": (persona) => persona.communicationStyle,
  "{{DIFFICULTY}}": (persona) => persona.difficulty,
  "{{DIFFICULTY_BEHAVIOR}}": (persona) =>
    persona.difficultyBehavior ?? "Be balanced - raise real objections but don't be unreasonable.",
  "{{PERSONALITY}}": (persona) => persona.personality ?? "Balanced",
  "{{PERSONALITY_TRAITS}}": (persona) => persona.personalityTraits ?? "Even-tempered, reasonable",
  "{{PERSONALITY_BEHAVIOR}}": (persona) =>
    persona.personalityBehavior ??
    "You react proportionally to what's actually said, without a strong bias toward being easy or hard to convince.",
  "{{MOOD}}": (persona) => persona.mood ?? "Neutral",
  "{{MOOD_BEHAVIOR}}": (persona) =>
    persona.moodBehavior ??
    "You're in a normal, professional headspace - neither especially warm nor cold.",
};

export function buildSystemPrompt(persona: PersonaConfig): string {
  let template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

  for (const [placeholder, resolve] of Object.entries(PLACEHOLDERS)) {
    template = template.split(placeholder).join(resolve(persona));
  }

  return template;
}

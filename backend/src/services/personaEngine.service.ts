import fs from "node:fs";
import path from "node:path";
import type { PersonaConfig } from "../types/persona";

type RolePoolKey = "general" | "technical" | "financial";

interface PersonalityDefinition {
  id: string;
  label: string;
  traits: string[];
  preferredRoles: RolePoolKey;
  behavior: string;
}

interface MoodDefinition {
  id: string;
  label: string;
  behavior: string;
}

interface DifficultyDefinition {
  id: string;
  behavior: string;
}

type RolePools = Record<RolePoolKey, string[]>;

interface NamePools {
  first: string[];
  last: string[];
}

const DATA_DIR = path.resolve(__dirname, "../../../prompts/data");

function loadJson<T>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf-8")) as T;
}

const industries = loadJson<string[]>("industries.json");
const roles = loadJson<RolePools>("roles.json");
const companySizes = loadJson<string[]>("companySizes.json");
const budgets = loadJson<string[]>("budgets.json");
const decisionStyles = loadJson<string[]>("decisionStyles.json");
const objectionStyles = loadJson<string[]>("objectionStyles.json");
const communicationStyles = loadJson<string[]>("communicationStyles.json");
const names = loadJson<NamePools>("names.json");
const personalities = loadJson<PersonalityDefinition[]>("personalities.json");
const moods = loadJson<MoodDefinition[]>("moods.json");
const difficulties = loadJson<DifficultyDefinition[]>("difficulties.json");
const greetings = loadJson<string[]>("greetings.json");
const introductions = loadJson<string[]>("introductions.json");
const invitations = loadJson<string[]>("invitations.json");

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickRole(personality: PersonalityDefinition): string {
  const preferredPool = roles[personality.preferredRoles];
  const preferredChance = personality.preferredRoles === "general" ? 0.85 : 0.7;

  if (preferredPool.length > 0 && Math.random() < preferredChance) {
    return pickOne(preferredPool);
  }
  return pickOne(roles.general);
}

export function generateRandomPersona(): PersonaConfig {
  const personality = pickOne(personalities);
  const mood = pickOne(moods);
  const difficulty = pickOne(difficulties);
  const firstName = pickOne(names.first);
  const lastName = pickOne(names.last);

  return {
    name: `${firstName} ${lastName}`,
    role: pickRole(personality),
    industry: pickOne(industries),
    companySize: pickOne(companySizes),
    budget: pickOne(budgets),
    decisionStyle: pickOne(decisionStyles),
    objectionStyle: pickOne(objectionStyles),
    communicationStyle: pickOne(communicationStyles),
    difficulty: difficulty.id,
    personality: personality.label,
    personalityTraits: personality.traits.join(", "),
    personalityBehavior: personality.behavior,
    mood: mood.label,
    moodBehavior: mood.behavior,
    difficultyBehavior: difficulty.behavior,
  };
}

function fillIntroduction(template: string, persona: PersonaConfig): string {
  return template
    .split("{{NAME}}")
    .join(persona.name ?? "your contact")
    .split("{{ROLE}}")
    .join(persona.role);
}

export function buildOpening(persona: PersonaConfig): string {
  const greeting = pickOne(greetings);
  const introduction = fillIntroduction(pickOne(introductions), persona);
  const invitation = pickOne(invitations);

  return `${greeting} ${introduction} ${invitation}`;
}

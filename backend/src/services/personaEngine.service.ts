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

interface SpeakingStyleDefinition {
  id: string;
  label: string;
  rate: number;
  pitch: number;
  pauseMs: number;
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
const speakingStyles = loadJson<SpeakingStyleDefinition[]>("speakingStyles.json");
const greetings = loadJson<string[]>("greetings.json");
const invitations = loadJson<string[]>("invitations.json");
const companyNames = loadJson<string[]>("companyNames.json");
const mainResponsibilitiesPool = loadJson<string[]>("mainResponsibilities.json");
const currentChallengesPool = loadJson<string[]>("currentChallenges.json");
const buyingMotivationsPool = loadJson<string[]>("buyingMotivations.json");
const painPointsPool = loadJson<string[]>("painPoints.json");
const successMetricsPool = loadJson<string[]>("successMetrics.json");
const expectedOutcomesPool = loadJson<string[]>("expectedOutcomes.json");

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
  const speakingStyle = pickOne(speakingStyles);
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
    speakingStyle: speakingStyle.label,
    speechRate: speakingStyle.rate,
    speechPitch: speakingStyle.pitch,
    speechPauseMs: speakingStyle.pauseMs,
    companyName: pickOne(companyNames),
    mainResponsibilities: pickOne(mainResponsibilitiesPool),
    currentChallenges: pickOne(currentChallengesPool),
    buyingMotivation: pickOne(buyingMotivationsPool),
    painPoints: pickOne(painPointsPool),
    successMetrics: pickOne(successMetricsPool),
    expectedOutcome: pickOne(expectedOutcomesPool),
  };
}

function firstNameOf(persona: PersonaConfig): string | undefined {
  return persona.name?.trim().split(/\s+/)[0];
}

/**
 * The opening message is how a busy professional actually answers a business phone
 * call - a bare "Hello?", a time-of-day greeting, or their name, and nothing else.
 * No job title, no company, no explanation. Everything else (role, company,
 * invitation to hear the pitch) is revealed gradually across later turns, driven by
 * the system prompt rather than templated here.
 */
export function buildOpening(persona: PersonaConfig): string {
  const firstName = firstNameOf(persona);
  const pool = firstName ? greetings : greetings.filter((template) => !template.includes("{{NAME}}"));
  return pickOne(pool).split("{{NAME}}").join(firstName ?? "");
}

/** A short, name-only example of how the buyer might mention their name once the
 * salesperson has introduced themselves - deliberately role-free, since job title
 * only comes up once it's asked or the conversation naturally calls for it. */
export function buildNameOnlyIntroExample(persona: PersonaConfig): string {
  const firstName = firstNameOf(persona);
  return firstName ? `I'm ${firstName}.` : "";
}

/** A randomly-picked example of how the buyer might eventually invite the
 * salesperson to continue and lead the conversation, once introductions are done. */
export function buildInvitationExample(): string {
  return pickOne(invitations);
}

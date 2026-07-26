import fs from "node:fs";
import path from "node:path";
import { getLlmProvider } from "./llm/llmProviderFactory";
import type { JsonSchema } from "./llm/llmProvider";
import { DEFAULT_PERSONA } from "./persona.service";
import { deriveBuyerState } from "./buyerState/buyerState.service";
import type { ChatTurn } from "../types/chat";
import type { CoachingReportGrades, CoachingReportResponseBody } from "../types/coachingReport";
import type { PersonaConfig } from "../types/persona";
import type { HttpError } from "../types/http";

const PROMPT_PATH = path.resolve(__dirname, "../../../prompts/coaching-report-prompt.md");
const COACHING_SYSTEM_PROMPT = fs.readFileSync(PROMPT_PATH, "utf-8");

const GRADE_FIELDS: (keyof CoachingReportGrades)[] = [
  "rapport",
  "discovery",
  "objectionHandling",
  "productKnowledge",
  "communication",
  "closing",
];

const GRADE_FIELD: JsonSchema = {
  type: "number",
  minimum: 0,
  maximum: 10,
  description: "A score from 0 (not attempted / very poor) to 10 (expert-level).",
};

const RESPONSE_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    overallScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Overall performance score from 0 to 100.",
    },
    grades: {
      type: "object",
      properties: Object.fromEntries(GRADE_FIELDS.map((field) => [field, GRADE_FIELD])),
      required: GRADE_FIELDS,
    },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    missedOpportunities: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
  required: ["overallScore", "grades", "strengths", "improvements", "missedOpportunities", "summary"],
};

function formatTranscript(history: ChatTurn[]): string {
  return history
    .map((turn) => `${turn.sender === "ai" ? "Customer" : "Salesperson"}: ${turn.text}`)
    .join("\n");
}

function describePersona(persona?: PersonaConfig): string {
  if (!persona) {
    return "No persona details were provided.";
  }

  return [
    `Name: ${persona.name ?? "Unknown"}`,
    `Role: ${persona.role}`,
    `Industry: ${persona.industry}`,
    `Personality: ${persona.personality ?? "Unspecified"}`,
    `Mood: ${persona.mood ?? "Unspecified"}`,
    `Difficulty: ${persona.difficulty}`,
  ].join("\n");
}

function describeBuyerState(conversationHistory: ChatTurn[], persona?: PersonaConfig): string {
  const buyerState = deriveBuyerState(conversationHistory, persona ?? DEFAULT_PERSONA);

  return [
    `Final interest level: ${buyerState.interestBucket}`,
    `Conversation stage reached: ${buyerState.stage.replace(/_/g, " ")}`,
    `Buyer's patience by the end of the call: ${buyerState.patience.tier} (internal score ${buyerState.patience.score}/100)${buyerState.patience.shouldEndCall ? " - the buyer's patience ran out during this call, likely due to rambling, repetition, dodged questions, or generic pitching. Call this out specifically in the feedback." : ""}`,
    `Pain points surfaced: ${buyerState.memory.painPoints.length > 0 ? buyerState.memory.painPoints.join("; ") : "none identified"}`,
    `Objections raised by the buyer: ${buyerState.memory.objectionsRaised.length > 0 ? buyerState.memory.objectionsRaised.join(", ") : "none"}`,
    `Follow-ups the salesperson promised: ${buyerState.memory.promisedFollowUps.length > 0 ? buyerState.memory.promisedFollowUps.join("; ") : "none"}`,
  ].join("\n");
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidEvaluation(value: unknown): value is CoachingReportResponseBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (!isFiniteNumber(candidate.overallScore)) {
    return false;
  }

  if (typeof candidate.grades !== "object" || candidate.grades === null) {
    return false;
  }
  const grades = candidate.grades as Record<string, unknown>;
  if (!GRADE_FIELDS.every((field) => isFiniteNumber(grades[field]))) {
    return false;
  }

  if (!isStringArray(candidate.strengths)) {
    return false;
  }
  if (!isStringArray(candidate.improvements)) {
    return false;
  }
  if (!isStringArray(candidate.missedOpportunities)) {
    return false;
  }
  if (typeof candidate.summary !== "string" || candidate.summary.trim().length === 0) {
    return false;
  }

  return true;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(raw: CoachingReportResponseBody): CoachingReportResponseBody {
  const grades = Object.fromEntries(
    GRADE_FIELDS.map((field) => [field, Math.round(clamp(raw.grades[field], 0, 10) * 10) / 10])
  ) as unknown as CoachingReportGrades;

  return {
    overallScore: Math.round(clamp(raw.overallScore, 0, 100)),
    grades,
    strengths: raw.strengths,
    improvements: raw.improvements,
    missedOpportunities: raw.missedOpportunities,
    summary: raw.summary,
  };
}

async function requestEvaluation(userPrompt: string): Promise<unknown> {
  const provider = getLlmProvider();
  try {
    return await provider.generateJson<unknown>(COACHING_SYSTEM_PROMPT, userPrompt, RESPONSE_SCHEMA);
  } catch {
    return undefined;
  }
}

export async function generateCoachingReport(
  conversationHistory: ChatTurn[],
  persona?: PersonaConfig
): Promise<CoachingReportResponseBody> {
  if (conversationHistory.length === 0) {
    const error: HttpError = new Error(
      "`conversationHistory` must contain at least one message to generate a coaching report."
    );
    error.statusCode = 400;
    throw error;
  }

  const userPrompt = [
    "## Buyer persona",
    describePersona(persona),
    "",
    "## Buyer engagement signals (internal, derived from the transcript)",
    describeBuyerState(conversationHistory, persona),
    "",
    "## Conversation transcript",
    formatTranscript(conversationHistory),
  ].join("\n");

  let raw = await requestEvaluation(userPrompt);

  if (!isValidEvaluation(raw)) {
    // Gemini returned invalid or malformed JSON - retry once before giving up.
    raw = await requestEvaluation(userPrompt);
  }

  if (!isValidEvaluation(raw)) {
    const error: HttpError = new Error(
      "We couldn't generate your coaching report right now. Please try again in a moment."
    );
    error.statusCode = 502;
    throw error;
  }

  return normalize(raw);
}

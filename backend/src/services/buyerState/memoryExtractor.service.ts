import type { ChatTurn } from "../../types/chat";
import type { ConversationMemory } from "../../types/conversationState";

const COMPANY_STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "our",
  "this",
  "that",
  "your",
  "my",
  "here",
  "there",
  "eubric",
  "eubric ai",
]);

const OBJECTION_KEYWORDS: Record<string, string[]> = {
  pricing: ["price", "pricing", "cost", "expensive", "budget"],
  security: ["security", "secure", "data privacy", "compliance", "gdpr", "soc 2"],
  integration: ["integrate", "integration", "api", "existing tools", "ats"],
  competitors: ["competitor", "hirevue", "mercer mettl", "paradox", "modernhire", "other vendors"],
  implementation: ["implementation", "onboarding", "rollout", "timeline", "deploy"],
  roi: ["roi", "return on investment", "payback", "value"],
  legal_procurement: ["legal", "procurement", "contract", "vendor review"],
  training_change_mgmt: ["training", "change management", "adoption", "learning curve"],
  vendor_lock_in: ["lock-in", "lock in", "switching cost", "vendor lock"],
};

const OBJECTION_CUE_PATTERN = /(concern|worried|not sure|what about|how do we know|\?)/i;

const PAIN_CUES = [
  "problem",
  "struggle",
  "struggling",
  "issue",
  "pain point",
  "bottleneck",
  "manual",
  "time-consuming",
  "time consuming",
  "hard to",
  "difficult to",
  "challenge",
];

const GOAL_CUES = [
  "goal",
  "trying to",
  "want to",
  "looking to",
  "hoping to",
  "objective",
  "aim to",
  "we'd like to",
  "we would like to",
];

// Cues that mark a sentence as a meaningful business fact/claim about Eubric AI -
// who it serves, what it integrates with, what it does - worth remembering and
// referencing later, rather than every sentence the salesperson says.
const KEY_FACT_CUES = [
  "we work with",
  "we serve",
  "we support",
  "our customers",
  "our clients",
  "we specialize in",
  "we focus on",
  "designed for",
  "built for",
  "integrate with",
  "compatible with",
  "used by",
  "companies like",
  "we help",
  "we've helped",
  "we have helped",
];

const FOLLOWUP_CUES = [
  "i'll send",
  "i will send",
  "i'll follow up",
  "i will follow up",
  "let me get you",
  "i'll get back to you",
  "i will get back to you",
  "we'll provide",
  "we will provide",
  "i can send over",
  "i'll share",
];

const TOPIC_TAXONOMY: Record<string, string[]> = {
  security: ["security", "secure", "data privacy", "compliance"],
  integration: ["integration", "integrate", "api", "ats"],
  pricing: ["price", "pricing", "cost", "budget"],
  roi: ["roi", "return on investment", "payback", "value"],
  implementation: ["implementation", "onboarding", "rollout", "deploy", "timeline"],
  competitors: ["competitor", "hirevue", "mercer mettl", "paradox", "modernhire"],
  support: ["support", "customer success", "help desk"],
  training: ["training", "learning curve", "enablement"],
  compliance: ["compliance", "gdpr", "soc 2", "audit"],
  data_privacy: ["data privacy", "pii", "confidential"],
  scalability: ["scalability", "scale", "volume", "growth"],
  adoption: ["adoption", "recruiter workflow", "candidate experience"],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trim()}...` : trimmed;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function containsAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}

function findCueExcerpt(text: string, cues: string[]): string | undefined {
  const sentences = splitSentences(text);
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (cues.some((cue) => lower.includes(cue))) {
      return truncate(sentence, 140);
    }
  }
  return undefined;
}

function extractSalespersonName(userTexts: string[]): string | undefined {
  const namePattern = /\bmy name is ([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/;
  const introPattern = /\bi'?m\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)\b[^.?!]{0,20}\bfrom\b/;

  for (const text of userTexts) {
    const nameMatch = namePattern.exec(text);
    if (nameMatch) return nameMatch[1];
    const introMatch = introPattern.exec(text);
    if (introMatch) return introMatch[1];
  }
  return undefined;
}

function extractCompanyName(userTexts: string[]): string | undefined {
  const patterns = [
    /\b(?:from|at|with)\s+([A-Z][a-zA-Z0-9&]*(?:\s[A-Z][a-zA-Z0-9&]*){0,3})/,
    /\bwe'?re\s+(?:from\s+)?([A-Z][a-zA-Z0-9&]*(?:\s[A-Z][a-zA-Z0-9&]*){0,3})/,
    /\bour company is\s+([A-Z][a-zA-Z0-9&]*(?:\s[A-Z][a-zA-Z0-9&]*){0,3})/,
  ];

  for (const text of userTexts) {
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        const candidate = match[1].trim();
        if (!COMPANY_STOPWORDS.has(candidate.toLowerCase())) {
          return candidate;
        }
      }
    }
  }
  return undefined;
}

export function extractMemory(history: ChatTurn[]): ConversationMemory {
  const userTexts = history.filter((t) => t.sender === "user").map((t) => t.text);
  const aiTexts = history.filter((t) => t.sender === "ai").map((t) => t.text);

  const topicsDiscussed = new Set<string>();
  const objectionsRaised = new Set<string>();
  const questionsAsked: string[] = [];
  const seenQuestions = new Set<string>();
  const painPoints: string[] = [];
  const seenPainPoints = new Set<string>();
  const goalsMentioned: string[] = [];
  const seenGoals = new Set<string>();
  const promisedFollowUps: string[] = [];
  const seenFollowUps = new Set<string>();
  const keyFactsMentioned: string[] = [];
  const seenKeyFacts = new Set<string>();

  for (const text of [...userTexts, ...aiTexts]) {
    for (const [topic, keywords] of Object.entries(TOPIC_TAXONOMY)) {
      if (containsAny(text, keywords)) {
        topicsDiscussed.add(topic);
      }
    }
  }

  for (const text of aiTexts) {
    if (OBJECTION_CUE_PATTERN.test(text)) {
      for (const [category, keywords] of Object.entries(OBJECTION_KEYWORDS)) {
        if (containsAny(text, keywords)) {
          objectionsRaised.add(category);
        }
      }
    }

    for (const sentence of splitSentences(text)) {
      if (sentence.trim().endsWith("?")) {
        const key = normalize(sentence).slice(0, 60);
        if (key && !seenQuestions.has(key)) {
          seenQuestions.add(key);
          questionsAsked.push(truncate(sentence, 60));
        }
      }
    }
  }

  for (const text of userTexts) {
    const painExcerpt = findCueExcerpt(text, PAIN_CUES);
    if (painExcerpt) {
      const key = normalize(painExcerpt);
      if (!seenPainPoints.has(key)) {
        seenPainPoints.add(key);
        painPoints.push(painExcerpt);
      }
    }

    const goalExcerpt = findCueExcerpt(text, GOAL_CUES);
    if (goalExcerpt) {
      const key = normalize(goalExcerpt);
      if (!seenGoals.has(key)) {
        seenGoals.add(key);
        goalsMentioned.push(goalExcerpt);
      }
    }

    const followUpExcerpt = findCueExcerpt(text, FOLLOWUP_CUES);
    if (followUpExcerpt) {
      const key = normalize(followUpExcerpt);
      if (!seenFollowUps.has(key)) {
        seenFollowUps.add(key);
        promisedFollowUps.push(followUpExcerpt);
      }
    }

    const keyFactExcerpt = findCueExcerpt(text, KEY_FACT_CUES);
    if (keyFactExcerpt) {
      const key = normalize(keyFactExcerpt);
      if (!seenKeyFacts.has(key)) {
        seenKeyFacts.add(key);
        keyFactsMentioned.push(keyFactExcerpt);
      }
    }
  }

  return {
    salespersonName: extractSalespersonName(userTexts),
    companyName: extractCompanyName(userTexts),
    topicsDiscussed: Array.from(topicsDiscussed),
    objectionsRaised: Array.from(objectionsRaised),
    questionsAsked,
    painPoints,
    goalsMentioned,
    promisedFollowUps,
    keyFactsMentioned,
  };
}

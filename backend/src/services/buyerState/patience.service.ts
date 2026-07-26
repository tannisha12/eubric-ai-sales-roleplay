import type { ChatTurn } from "../../types/chat";
import type { PersonaConfig } from "../../types/persona";
import type { Patience, PatienceTier } from "../../types/conversationState";
import {
  QUANTIFIED_CLAIM_PATTERN,
  PROOF_PHRASES,
  BUZZWORDS,
  countMatches,
  jaccardSimilarity,
} from "./interestScore.service";

const RAW_DELTA_CAP = 10;
const NEAR_DUPLICATE_SIMILARITY = 0.6;

// A message this long is starting to ramble rather than make a point - each additional
// block beyond it chips away a little more.
const LONG_MESSAGE_THRESHOLD_CHARS = 700;
const LONG_MESSAGE_BLOCK_CHARS = 400;

// How much starting patience a persona has, and how much faster negative moments burn
// through it, based on their mood - an Impatient or Busy buyer has less runway for a
// rambling, repetitive, or evasive salesperson than a Friendly or Analytical one.
const PATIENCE_PROFILE_BY_MOOD: Record<string, { start: number; lossMultiplier: number }> = {
  Impatient: { start: 60, lossMultiplier: 1.6 },
  Busy: { start: 75, lossMultiplier: 1.3 },
  Skeptical: { start: 85, lossMultiplier: 1.1 },
  Neutral: { start: 90, lossMultiplier: 1.0 },
  Analytical: { start: 100, lossMultiplier: 0.9 },
  Curious: { start: 100, lossMultiplier: 0.85 },
  Friendly: { start: 100, lossMultiplier: 0.8 },
};
const DEFAULT_PATIENCE_PROFILE = { start: 90, lossMultiplier: 1.0 };

function getPatienceProfile(persona: PersonaConfig): { start: number; lossMultiplier: number } {
  if (persona.mood && PATIENCE_PROFILE_BY_MOOD[persona.mood]) {
    return PATIENCE_PROFILE_BY_MOOD[persona.mood];
  }
  return DEFAULT_PATIENCE_PROFILE;
}

function computeRawDelta(
  currentText: string,
  previousUserTexts: string[],
  precedingAiText: string | undefined
): number {
  let delta = 0;
  const trimmed = currentText.trim();
  const wasAskedQuestion = !!precedingAiText && precedingAiText.trim().endsWith("?");

  // Talks too much.
  if (trimmed.length > LONG_MESSAGE_THRESHOLD_CHARS) {
    const overage = trimmed.length - LONG_MESSAGE_THRESHOLD_CHARS;
    delta -= 2 + Math.min(3, Math.floor(overage / LONG_MESSAGE_BLOCK_CHARS));
  }

  // Repeats themselves.
  const isNearDuplicate = previousUserTexts.some(
    (prior) =>
      prior.length > 30 && trimmed.length > 30 && jaccardSimilarity(prior, trimmed) > NEAR_DUPLICATE_SIMILARITY
  );
  if (isNearDuplicate) delta -= 4;

  // Avoids answering - gave a thin reply right after being asked something direct.
  if (wasAskedQuestion && trimmed.length < 15) delta -= 3;

  // Uses generic pitches - buzzword-heavy with no real substance behind it.
  const hasEvidence = QUANTIFIED_CLAIM_PATTERN.test(trimmed) || countMatches(trimmed, PROOF_PHRASES) > 0;
  const buzzwordCount = countMatches(trimmed, BUZZWORDS);
  if (buzzwordCount >= 2 && !hasEvidence) delta -= 3;

  // Performs well - concrete, substantiated, responsive.
  if (QUANTIFIED_CLAIM_PATTERN.test(trimmed)) delta += 2;
  if (countMatches(trimmed, PROOF_PHRASES) > 0) delta += 2;
  if (wasAskedQuestion && trimmed.length >= 20 && trimmed.length <= LONG_MESSAGE_THRESHOLD_CHARS) delta += 1;

  return Math.max(-RAW_DELTA_CAP, Math.min(RAW_DELTA_CAP, delta));
}

function scoreToTier(score: number): PatienceTier {
  if (score <= 0) return "exhausted";
  if (score <= 25) return "low";
  if (score <= 70) return "medium";
  return "high";
}

function tierToGuidance(tier: PatienceTier): string {
  switch (tier) {
    case "exhausted":
      return "Your patience for this call has run out. Politely but firmly end the conversation now - do not ask any more questions or keep evaluating the pitch. See the closing-line suggestions below for how to actually phrase it.";
    case "low":
      return "You're close to done with this call. Your tone should be visibly clipped and short, and you should make it clear - through tone, not by stating a number - that you're running out of patience. Give one more real chance, but if the pattern of rambling, repeating, dodging, or generic claims continues, your very next reply should end the call politely.";
    case "medium":
      return "Your patience is wearing a little thin. Mild irritation can show through if the salesperson keeps rambling, repeating themselves, dodging your questions, or leaning on generic claims - a short pointed line like \"I think I already asked that\" or \"Can we get to the point?\" would fit here if it's warranted.";
    case "high":
    default:
      return "You still have plenty of patience for this call - a slightly long-winded or imperfect answer doesn't bother you much yet.";
  }
}

/**
 * Internal-only measure of tolerance for how the call itself is going - distinct from
 * interest in the product. Recomputed fresh from the full history each call, the same
 * way the rest of buyer state is derived; never sent to the client.
 */
export function derivePatience(history: ChatTurn[], persona: PersonaConfig): Patience {
  const profile = getPatienceProfile(persona);
  let score = profile.start;
  const previousUserTexts: string[] = [];

  for (let i = 0; i < history.length; i += 1) {
    const turn = history[i];
    if (turn.sender !== "user") continue;

    const precedingAiText = i > 0 && history[i - 1].sender === "ai" ? history[i - 1].text : undefined;
    const rawDelta = computeRawDelta(turn.text, previousUserTexts, precedingAiText);
    const scaledDelta = rawDelta < 0 ? rawDelta * profile.lossMultiplier : rawDelta;

    score = Math.max(0, Math.min(100, score + scaledDelta));
    previousUserTexts.push(turn.text);
  }

  const rounded = Math.round(score);
  const tier = scoreToTier(rounded);

  return {
    score: rounded,
    tier,
    guidance: tierToGuidance(tier),
    shouldEndCall: tier === "exhausted",
  };
}

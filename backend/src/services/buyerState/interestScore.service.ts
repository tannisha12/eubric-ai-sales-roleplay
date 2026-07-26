import type { ChatTurn } from "../../types/chat";
import type { InterestBucket } from "../../types/conversationState";

const RAW_DELTA_CAP = 12;

export const QUANTIFIED_CLAIM_PATTERN =
  /(\d+%|\$\d|\d+x\b|\d+\s*(day|days|week|weeks|hour|hours|minute|minutes))/i;

export const PROOF_PHRASES = [
  "for example",
  "case study",
  "one of our customers",
  "we helped",
  "a client of ours",
  "one client",
  "customer of ours",
];

export const PRODUCT_TERMS = [
  "interview",
  "screening",
  "ats",
  "integration",
  "candidate experience",
  "structured interview",
  "bias",
  "time-to-hire",
  "time to hire",
  "recruiter",
  "hiring",
];

export const BUZZWORDS = [
  "cutting-edge",
  "cutting edge",
  "revolutionary",
  "game-changing",
  "game changing",
  "next-generation",
  "next generation",
  "state-of-the-art",
  "state of the art",
  "synergy",
  "seamless",
  "leverage ai",
  "powered by ai",
  "world-class",
  "best-in-class",
];

const CONTRADICTION_PATTERN =
  /([a-z][a-z\s]{0,20}?)\s+(?:takes|is|will take)\s+(\d+)\s*(day|days|week|weeks|hour|hours|minute|minutes)/gi;

function words(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = words(a);
  const setB = words(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function countMatches(text: string, needles: string[]): number {
  const lower = text.toLowerCase();
  return needles.reduce((count, needle) => count + (lower.includes(needle) ? 1 : 0), 0);
}

function normalizeSubject(subject: string): string {
  return subject.toLowerCase().replace(/\b(the|a|an|it|our|this|that)\b/g, "").trim();
}

function extractNumericClaims(text: string): Array<{ subject: string; value: string }> {
  const claims: Array<{ subject: string; value: string }> = [];
  let match: RegExpExecArray | null;
  CONTRADICTION_PATTERN.lastIndex = 0;
  while ((match = CONTRADICTION_PATTERN.exec(text)) !== null) {
    const subject = normalizeSubject(match[1]);
    if (subject.length < 3) continue;
    claims.push({ subject, value: `${match[2]} ${match[3].replace(/s$/, "")}` });
  }
  return claims;
}

function computeRawDelta(
  currentText: string,
  previousUserTexts: string[],
  precedingAiText: string | undefined,
  numericClaimsSoFar: Map<string, string>
): number {
  let delta = 0;
  const trimmed = currentText.trim();
  const wasAskedQuestion = !!precedingAiText && precedingAiText.trim().endsWith("?");

  if (QUANTIFIED_CLAIM_PATTERN.test(trimmed)) delta += 4;
  if (countMatches(trimmed, PROOF_PHRASES) > 0) delta += 4;
  if (wasAskedQuestion && trimmed.length > 20 && !trimmed.trim().startsWith("why")) delta += 3;
  if (countMatches(trimmed, PRODUCT_TERMS) > 0) delta += 2;
  if (trimmed.endsWith("?") && trimmed.length >= 40 && trimmed.length <= 400) delta += 2;

  if (wasAskedQuestion && trimmed.length < 15) delta -= 3;

  const buzzwordCount = countMatches(trimmed, BUZZWORDS);
  const hasEvidence = QUANTIFIED_CLAIM_PATTERN.test(trimmed) || countMatches(trimmed, PROOF_PHRASES) > 0;
  if (buzzwordCount >= 2 && !hasEvidence) delta -= 4;

  const isNearDuplicate = previousUserTexts.some(
    (prior) => prior.length > 30 && trimmed.length > 30 && jaccardSimilarity(prior, trimmed) > 0.6
  );
  if (isNearDuplicate) delta -= 3;

  const claims = extractNumericClaims(trimmed);
  let contradictionFound = false;
  for (const claim of claims) {
    const existing = numericClaimsSoFar.get(claim.subject);
    if (existing && existing !== claim.value) {
      contradictionFound = true;
    } else if (!existing) {
      numericClaimsSoFar.set(claim.subject, claim.value);
    }
  }
  if (contradictionFound) delta -= 6;

  return Math.max(-RAW_DELTA_CAP, Math.min(RAW_DELTA_CAP, delta));
}

export function computeInterestScore(history: ChatTurn[]): number {
  let score = 50;
  const previousUserTexts: string[] = [];
  const numericClaimsSoFar = new Map<string, string>();
  let consecutiveEvasions = 0;

  for (let i = 0; i < history.length; i += 1) {
    const turn = history[i];
    if (turn.sender !== "user") continue;

    const precedingAiText = i > 0 && history[i - 1].sender === "ai" ? history[i - 1].text : undefined;
    let rawDelta = computeRawDelta(turn.text, previousUserTexts, precedingAiText, numericClaimsSoFar);

    const wasAskedQuestion = !!precedingAiText && precedingAiText.trim().endsWith("?");
    const isEvasive = wasAskedQuestion && turn.text.trim().length < 15;
    if (isEvasive) {
      consecutiveEvasions += 1;
      if (consecutiveEvasions >= 2) {
        rawDelta = Math.max(-RAW_DELTA_CAP, rawDelta - 2);
      }
    } else {
      consecutiveEvasions = 0;
    }

    const effectiveDelta =
      rawDelta > 0 ? rawDelta * (1 - score / 100) : rawDelta * (score / 100);

    score = Math.max(0, Math.min(100, score + effectiveDelta));
    previousUserTexts.push(turn.text);
  }

  return Math.round(score);
}

export function scoreToBucket(score: number): InterestBucket {
  if (score <= 30) return "low";
  if (score <= 60) return "medium";
  return "high";
}

export function bucketToToneGuidance(bucket: InterestBucket): string {
  switch (bucket) {
    case "low":
      return "You're skeptical of this pitch so far. Keep your responses shorter, push back more, and don't make it easy - raise real, pointed objections rather than warming up.";
    case "high":
      return "This pitch is landing well with you. You're more cooperative now - it's natural to start asking about implementation, pricing, and next steps rather than staying purely skeptical.";
    case "medium":
    default:
      return "You're giving this a fair, balanced hearing. Stay cautiously engaged - ask real questions but don't act fully convinced yet.";
  }
}

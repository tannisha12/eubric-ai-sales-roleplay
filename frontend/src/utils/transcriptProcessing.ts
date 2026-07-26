/**
 * The browser Speech Recognition API frequently mishears "Eubric AI" as things like
 * "you brick AI", "ubrick", "hubrick", "rubric AI", or "eubrick". This module normalizes
 * those common mishearings and screens out clearly invalid transcripts (mic noise, stray
 * hallucinated phrases, empty fragments) before a voice transcript is ever sent to the chat
 * API - so the corrected text is what ends up in conversation history, the coaching
 * report, and the Gemini prompt.
 */

interface BrandReplacement {
  pattern: RegExp;
  replacement: string;
}

// Multi-word mishearings must run before the bare "brick ai" rule below, otherwise
// "brick ai" would match first and leave a stray leading word behind (e.g. "you Eubric AI").
// Add new mishearings here - order only matters relative to the generic "brick ai" rule.
const BRAND_NAME_REPLACEMENTS: BrandReplacement[] = [
  { pattern: /\byou\s*brick\s*ai\b/gi, replacement: "Eubric AI" },
  { pattern: /\bu\s*brick\s*ai\b/gi, replacement: "Eubric AI" },
  { pattern: /\ba\s*brick\s*ai\b/gi, replacement: "Eubric AI" },
  { pattern: /\be\s*brick\s*ai\b/gi, replacement: "Eubric AI" },
  { pattern: /\beu\s*brick\s*ai\b/gi, replacement: "Eubric AI" },
  { pattern: /\bnew\s*brick\s*ai\b/gi, replacement: "Eubric AI" },
  { pattern: /\bhubrick\s*ai\b/gi, replacement: "Eubric AI" },
  { pattern: /\brubric\s*ai\b/gi, replacement: "Eubric AI" },
  { pattern: /\bbrick\s*ai\b/gi, replacement: "Eubric AI" },
  // Not real English words, so safe to replace even without a trailing "ai".
  { pattern: /\bubrick\b/gi, replacement: "Eubric AI" },
  { pattern: /\bhubrick\b/gi, replacement: "Eubric AI" },
  { pattern: /\bubric\b/gi, replacement: "Eubric AI" },
  { pattern: /\beubrick\b/gi, replacement: "Eubric AI" },
];

export function normalizeTranscript(text: string): string {
  const trimmed = text.trim();

  // "Brick" spoken alone (the whole utterance) is a known mishearing of "Eubric AI".
  if (/^brick$/i.test(trimmed)) {
    return "Eubric AI";
  }

  let result = trimmed;
  for (const { pattern, replacement } of BRAND_NAME_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return result.trim().replace(/\s+/g, " ");
}

const BLOCKED_PHRASES = [
  "i love you",
  "i love u",
  "marry me",
  "will you marry me",
  "kiss me",
  "thanks for watching",
  "thank you for watching",
  "please subscribe",
  "like and subscribe",
];

const MIN_MEANINGFUL_WORDS = 3;
const MIN_CHAR_LENGTH = 4;
const MIN_ALNUM_RATIO = 0.4;
const MIN_CONFIDENCE = 0.35;

function hasExcessiveRepetition(words: string[]): boolean {
  if (words.length < 3) return false;

  for (let i = 0; i < words.length - 2; i += 1) {
    if (words[i] === words[i + 1] && words[i + 1] === words[i + 2]) {
      return true;
    }
  }

  const uniqueRatio = new Set(words).size / words.length;
  return words.length >= 4 && uniqueRatio < 0.4;
}

function looksLikeGibberish(words: string[]): boolean {
  const substantialWords = words.filter((word) => word.length > 2);
  if (substantialWords.length === 0) return false;

  const noVowelCount = substantialWords.filter((word) => !/[aeiou]/i.test(word)).length;
  return noVowelCount / substantialWords.length > 0.5;
}

function isMostlyPunctuation(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  const alnumCount = (trimmed.match(/[a-z0-9]/gi) ?? []).length;
  return alnumCount / trimmed.length < MIN_ALNUM_RATIO;
}

/**
 * Checks whether a (already normalized) transcript is reliable enough to act on.
 * `confidence` is the browser-reported recognition confidence (0-1) when available;
 * many browsers always report 0 for it, so a 0 is treated as "not reported" rather
 * than "zero confidence".
 */
export function isTranscriptValid(text: string, confidence?: number): boolean {
  if (isMostlyPunctuation(text)) return false;

  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s']/g, "");

  if (cleaned.length < MIN_CHAR_LENGTH) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < MIN_MEANINGFUL_WORDS) return false;

  if (BLOCKED_PHRASES.some((phrase) => cleaned === phrase || cleaned.includes(phrase))) {
    return false;
  }

  if (hasExcessiveRepetition(words)) return false;
  if (looksLikeGibberish(words)) return false;

  if (typeof confidence === "number" && confidence > 0 && confidence < MIN_CONFIDENCE) {
    return false;
  }

  return true;
}

export interface TranscriptDecision {
  shouldSend: boolean;
  normalizedTranscript: string;
}

/**
 * The single entry point the UI layer should call: normalizes the raw transcript,
 * then decides whether it's valid and distinct enough from the last sent transcript
 * to actually forward to the backend for this speaking turn.
 */
export function shouldSendTranscript(
  rawTranscript: string,
  confidence: number | undefined,
  lastSentTranscript: string | null
): TranscriptDecision {
  const normalizedTranscript = normalizeTranscript(rawTranscript);

  const isDuplicateOfLastTurn =
    lastSentTranscript !== null &&
    normalizedTranscript.toLowerCase() === lastSentTranscript.toLowerCase();

  const shouldSend = !isDuplicateOfLastTurn && isTranscriptValid(normalizedTranscript, confidence);

  return { shouldSend, normalizedTranscript };
}

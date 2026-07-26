import type { ChatTurn } from "../../types/chat";
import type { PersonaConfig } from "../../types/persona";
import type { VariationHints } from "../../types/conversationState";

const OPENER_POOL = [
  "Interesting.",
  "That's helpful.",
  "Okay, I have a few questions.",
  "That makes sense.",
  "Let's dig into that.",
  "I'm curious about something.",
  "Help me understand...",
  "I've seen vendors claim that before.",
  "Walk me through that.",
  "Fair enough, but...",
  "Right, so...",
  "Got it - next question...",
  "Okay, noted.",
  "That's fair.",
  "Alright, let's keep going.",
  "Good to know.",
  "Hmm, okay.",
  "Makes sense, but...",
];

const INTERRUPTION_PHRASES = [
  "Sorry to interrupt...",
  "Hold on...",
  "One second...",
  "Quick question...",
  "Wait, sorry...",
  "Actually, hold that thought...",
];

const INTERRUPTION_CUE_KEYWORDS = [
  "sorry",
  "wait",
  "hmm",
  "hold on",
  "one second",
  "quick question",
];

const MIN_TURNS_SINCE_LAST_INTERRUPTION = 3;
const INTERRUPTION_BAND_MODULO = 5; // ~20% band

// Short acknowledgment fillers, grouped by personality so different personas lean on
// different words - a busy executive clips it short ("Right."), a curious/friendly
// buyer lingers a bit ("That makes sense."). Keyed by PersonaConfig.personality (the
// label, e.g. "Friendly"), with a neutral fallback for personas without a match.
const DEFAULT_FILLER_POOL = ["I see.", "Got it.", "Right."];

const FILLER_POOL_BY_PERSONALITY: Record<string, string[]> = {
  Friendly: ["That makes sense.", "I see.", "Interesting."],
  "Busy Executive": ["Right.", "Got it."],
  "Highly Skeptical": ["Hmm.", "Right."],
  "Technical Buyer": ["I see.", "Got it."],
  "Financial Buyer": ["Right.", "Got it."],
  "Analytical Evaluator": ["Interesting.", "Hmm."],
};

const ALL_FILLERS = Array.from(
  new Set([DEFAULT_FILLER_POOL, ...Object.values(FILLER_POOL_BY_PERSONALITY)].flat())
);

const MIN_TURNS_SINCE_LAST_FILLER = 3;
const FILLER_BAND_MODULO = 3; // ~33% chance once eligible, so it's rare, not clockwork

function getFillerPool(persona?: PersonaConfig): string[] {
  if (persona?.personality && FILLER_POOL_BY_PERSONALITY[persona.personality]) {
    return FILLER_POOL_BY_PERSONALITY[persona.personality];
  }
  return DEFAULT_FILLER_POOL;
}

function containsStandaloneFiller(text: string): boolean {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim().toLowerCase());
  return ALL_FILLERS.some((filler) => sentences.includes(filler.toLowerCase()));
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function computeVariationHints(history: ChatTurn[], persona?: PersonaConfig): VariationHints {
  const aiTurns = history.filter((t) => t.sender === "ai");

  const usedOpeners = OPENER_POOL.filter((opener) =>
    aiTurns.some((turn) => turn.text.trim().toLowerCase().startsWith(opener.toLowerCase().slice(0, 10)))
  );
  const suggestedOpeners = OPENER_POOL.filter((opener) => !usedOpeners.includes(opener)).slice(0, 6);

  let turnsSinceLastInterruption = aiTurns.length;
  for (let i = aiTurns.length - 1; i >= 0; i -= 1) {
    const lower = aiTurns[i].text.toLowerCase();
    if (INTERRUPTION_CUE_KEYWORDS.some((cue) => lower.includes(cue))) {
      turnsSinceLastInterruption = aiTurns.length - 1 - i;
      break;
    }
  }

  const totalLength = history.reduce((sum, turn) => sum + turn.text.length, 0);
  const hash = stableHash(`${history.length}-${totalLength}`);
  const inBand = hash % INTERRUPTION_BAND_MODULO === 0;

  const suggestInterruption = turnsSinceLastInterruption >= MIN_TURNS_SINCE_LAST_INTERRUPTION && inBand;
  const usedInterruptionPhrases = INTERRUPTION_PHRASES.filter((phrase) =>
    aiTurns.some((turn) => turn.text.toLowerCase().includes(phrase.toLowerCase().replace("...", "")))
  );
  const suggestedInterruptionPhrases = INTERRUPTION_PHRASES.filter(
    (phrase) => !usedInterruptionPhrases.includes(phrase)
  ).slice(0, 4);

  let turnsSinceLastFiller = aiTurns.length;
  for (let i = aiTurns.length - 1; i >= 0; i -= 1) {
    if (containsStandaloneFiller(aiTurns[i].text)) {
      turnsSinceLastFiller = aiTurns.length - 1 - i;
      break;
    }
  }

  const fillerHash = stableHash(`filler-${history.length}-${totalLength}`);
  const fillerInBand = fillerHash % FILLER_BAND_MODULO === 0;
  const suggestFiller = turnsSinceLastFiller >= MIN_TURNS_SINCE_LAST_FILLER && fillerInBand;

  const personaFillerPool = getFillerPool(persona);
  const usedFillers = personaFillerPool.filter((filler) =>
    aiTurns.some((turn) => turn.text.toLowerCase().includes(filler.toLowerCase()))
  );
  const freshFillers = personaFillerPool.filter((filler) => !usedFillers.includes(filler));
  const suggestedFillerPhrases = freshFillers.length > 0 ? freshFillers : personaFillerPool;

  return {
    usedOpeners,
    suggestedOpeners,
    suggestInterruption,
    suggestedInterruptionPhrases,
    suggestFiller,
    suggestedFillerPhrases,
  };
}

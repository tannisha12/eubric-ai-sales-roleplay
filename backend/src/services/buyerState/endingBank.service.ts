import type { ChatTurn } from "../../types/chat";
import type { ConversationStage, EndingTier, InterestBucket, Patience } from "../../types/conversationState";

interface EndingSignals {
  stage: ConversationStage;
  interestBucket: InterestBucket;
  patience: Patience;
  userTurnCount: number;
}

// Realistic closing lines, grouped by how well the call has actually gone - so a
// strong call and a lukewarm one don't end the same way, and the same tier still
// varies across sessions instead of always reaching for the same line.
const ENDINGS_BY_TIER: Record<EndingTier, string[]> = {
  strong_next_step: [
    "Let's reconnect next week and get this moving.",
    "Go ahead and send over a proposal - I'll review it with my team.",
    "I'd like to set up a follow-up call with a couple of people on my team.",
    "This looks promising - let's talk about setting up a pilot.",
    "Send me the contract details and I'll get this in front of procurement.",
  ],
  soft_next_step: [
    "Please send me more information and I'll take a look.",
    "I'll discuss it with my team and get back to you.",
    "Let's plan to reconnect once I've had a chance to review this internally.",
    "Send over a case study or two and I'll pass them along.",
    "I need to run this by a few people before we go further.",
  ],
  noncommittal: [
    "Thanks for calling - I'll be in touch if anything changes.",
    "I appreciate the information, but I need to think about it.",
    "This isn't a priority for us right now, but keep us in mind.",
    "Thanks for the overview - I don't have a clear next step for you today, though.",
  ],
  decline: [
    "I'm not interested right now.",
    "This doesn't seem like the right fit for us.",
    "I don't think this is the right time - thanks for reaching out, though.",
    "We're going to pass on this for now.",
    "I need to jump - this isn't something we're pursuing right now.",
  ],
};

const SUGGESTIONS_PER_TURN = 4;

// A long, unproductive call that hasn't earned a real next step and isn't going
// anywhere - a realistic buyer would start winding it down rather than let it run
// forever.
const NONCOMMITTAL_TURN_THRESHOLD = 14;

function determineEndingTier(signals: EndingSignals): EndingTier | null {
  if (signals.patience.tier === "exhausted") {
    return "decline";
  }

  if (signals.stage === "next_steps") {
    return signals.interestBucket === "high" ? "strong_next_step" : "soft_next_step";
  }

  if (
    signals.userTurnCount >= NONCOMMITTAL_TURN_THRESHOLD &&
    signals.interestBucket === "low" &&
    signals.patience.tier !== "high"
  ) {
    return "noncommittal";
  }

  return null;
}

/**
 * Realistic, varied closing lines appropriate to how this specific call has gone -
 * empty when the call isn't actually at a natural ending point yet.
 */
export function getEndingSuggestions(signals: EndingSignals, history: ChatTurn[]): string[] {
  const tier = determineEndingTier(signals);
  if (!tier) return [];

  const aiTexts = history.filter((turn) => turn.sender === "ai").map((turn) => turn.text.toLowerCase());
  const alreadyUsed = (ending: string) =>
    aiTexts.some((text) => text.includes(ending.toLowerCase().replace(/[.!?]+$/, "")));

  const pool = ENDINGS_BY_TIER[tier];
  const unused = pool.filter((ending) => !alreadyUsed(ending));

  return (unused.length > 0 ? unused : pool).slice(0, SUGGESTIONS_PER_TURN);
}

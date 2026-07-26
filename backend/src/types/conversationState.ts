import type { ChatTurn } from "./chat";

export type ConversationStage =
  | "greeting"
  | "discovery"
  | "pain_exploration"
  | "product_evaluation"
  | "objections"
  | "roi_discussion"
  | "implementation"
  | "next_steps";

export type RoleFocusCategory =
  | "technical"
  | "financial"
  | "executive"
  | "hr_people"
  | "operations"
  | "general";

export type InterestBucket = "low" | "medium" | "high";

export type MoodTrend = "warming" | "cooling" | "steady";

export type PatienceTier = "high" | "medium" | "low" | "exhausted";

// How well this call has actually gone, for the purpose of picking a realistic closing
// line - not a strict "must end now" signal, just which pool of endings fits.
export type EndingTier = "strong_next_step" | "soft_next_step" | "noncommittal" | "decline";

export interface ConversationMemory {
  salespersonName?: string;
  companyName?: string;
  topicsDiscussed: string[];
  objectionsRaised: string[];
  questionsAsked: string[];
  painPoints: string[];
  goalsMentioned: string[];
  promisedFollowUps: string[];
  // Meaningful business facts the salesperson has stated about Eubric AI - who it
  // serves, what it integrates with, what it claims to do - so they can be referenced
  // naturally later ("You mentioned healthcare earlier...") instead of re-asked.
  keyFactsMentioned: string[];
}

export interface RoleFocus {
  category: RoleFocusCategory;
  guidance: string;
}

export interface MoodDrift {
  trend: MoodTrend;
  guidance: string;
}

export interface VariationHints {
  usedOpeners: string[];
  suggestedOpeners: string[];
  suggestInterruption: boolean;
  suggestedInterruptionPhrases: string[];
  suggestFiller: boolean;
  suggestedFillerPhrases: string[];
}

export interface StageResult {
  stage: ConversationStage;
  guidance: string;
}

// Internal only - how much longer this buyer is willing to tolerate a call that talks
// too much, repeats itself, dodges questions, or leans on generic pitches. Never sent
// to the client; used to steer the model's tone and, at zero, to end the call, and
// surfaced in the coaching report's context so feedback can explain why it dropped.
export interface Patience {
  score: number;
  tier: PatienceTier;
  guidance: string;
  shouldEndCall: boolean;
}

export interface BuyerState {
  interestScore: number;
  interestBucket: InterestBucket;
  interestToneGuidance: string;
  stage: ConversationStage;
  stageGuidance: string;
  moodDrift: MoodDrift;
  roleFocus: RoleFocus;
  memory: ConversationMemory;
  variation: VariationHints;
  userTurnCount: number;
  isOpeningReply: boolean;
  objectionSuggestions: string[];
  patience: Patience;
  // Empty unless the call is actually at a natural closing moment.
  endingSuggestions: string[];
}

export type Turn = ChatTurn;

import type { ChatTurn } from "../../types/chat";
import type { PersonaConfig } from "../../types/persona";
import type { BuyerState } from "../../types/conversationState";
import { extractMemory } from "./memoryExtractor.service";
import { computeInterestScore, scoreToBucket, bucketToToneGuidance } from "./interestScore.service";
import { computeStage } from "./stageProgression.service";
import { computeMoodDrift } from "./moodDrift.service";
import { mapRoleToFocus } from "./roleFocus.service";
import { computeVariationHints } from "./variationHints.service";
import { getObjectionSuggestions } from "./objectionBank.service";
import { derivePatience } from "./patience.service";
import { getEndingSuggestions } from "./endingBank.service";

export function deriveBuyerState(history: ChatTurn[], persona: PersonaConfig): BuyerState {
  const memory = extractMemory(history);
  const interestScore = computeInterestScore(history);
  const interestBucket = scoreToBucket(interestScore);
  const interestToneGuidance = bucketToToneGuidance(interestBucket);
  const { stage, guidance: stageGuidance } = computeStage(history, memory, interestBucket);
  const moodDrift = computeMoodDrift(history);
  const roleFocus = mapRoleToFocus(persona.role);
  const variation = computeVariationHints(history, persona);
  const objectionSuggestions = getObjectionSuggestions(roleFocus.category, history);
  const patience = derivePatience(history, persona);
  const userTurnCount = history.filter((t) => t.sender === "user").length;
  const aiTurnCount = history.filter((t) => t.sender === "ai").length;
  // True only for the very first substantive reply - right after the seeded opening
  // greeting and the salesperson's first message - so the prompt can enforce a short,
  // self-intro-only response instead of a full profile dump.
  const isOpeningReply = userTurnCount === 1 && aiTurnCount <= 1;
  const endingSuggestions = getEndingSuggestions({ stage, interestBucket, patience, userTurnCount }, history);

  return {
    interestScore,
    interestBucket,
    interestToneGuidance,
    stage,
    stageGuidance,
    moodDrift,
    roleFocus,
    memory,
    variation,
    userTurnCount,
    isOpeningReply,
    objectionSuggestions,
    patience,
    endingSuggestions,
  };
}

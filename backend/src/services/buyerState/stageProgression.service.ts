import type { ChatTurn } from "../../types/chat";
import type {
  ConversationMemory,
  ConversationStage,
  InterestBucket,
  StageResult,
} from "../../types/conversationState";
import { PRODUCT_TERMS, QUANTIFIED_CLAIM_PATTERN } from "./interestScore.service";

const CLOSING_CUES = ["next steps", "proposal", "pilot", "trial", "contract"];

const STAGE_GUIDANCE: Record<ConversationStage, string> = {
  greeting:
    "You've only just started this conversation. Keep things warm, brief, and natural - small talk and a light self-introduction first, before any business specifics. Don't ask hard questions or dive into product details yet.",
  discovery:
    "You're still trying to understand what they do. Ask clarifying questions about the product and their company - don't discuss pricing or ROI yet.",
  pain_exploration:
    "Now that you understand the basics, dig into what problems this actually solves for a team like yours - ask about the pain points it addresses.",
  product_evaluation:
    "You're evaluating whether the product actually works the way they claim - ask about features, how it fits your workflow, and how it compares to alternatives.",
  objections:
    "It's natural to start raising real concerns now - security, integration, competitors, or change management, whatever fits your persona.",
  roi_discussion:
    "You've done enough discovery now - it's natural to start asking about cost, ROI, and payback period.",
  implementation:
    "You're leaning toward taking this seriously - ask about implementation timeline, onboarding, and what rollout would actually look like.",
  next_steps:
    "You're ready to talk about what comes next - a follow-up call, a pilot, or a proposal - if the salesperson has earned it.",
};

function containsAny(text: string, needles: string[]): boolean {
  const lower = text.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}

export function computeStage(
  history: ChatTurn[],
  memory: ConversationMemory,
  interestBucket: InterestBucket
): StageResult {
  const userTurns = history.filter((t) => t.sender === "user");
  const userTurnCount = userTurns.length;
  const topicsCount = memory.topicsDiscussed.length;
  const painCount = memory.painPoints.length;

  const hasProductKeywordTurn = userTurns.some(
    (t) => t.text.length > 40 && containsAny(t.text, PRODUCT_TERMS)
  );
  const hasQuantifiedCue = userTurns.some((t) => QUANTIFIED_CLAIM_PATTERN.test(t.text));
  const latestUserText = userTurns.length > 0 ? userTurns[userTurns.length - 1].text : "";
  const hasClosingCue = containsAny(latestUserText, CLOSING_CUES);

  const discoveryGate = userTurnCount >= 1 && (topicsCount >= 1 || hasProductKeywordTurn);
  const painGate = userTurnCount >= 3 && (topicsCount >= 2 || painCount >= 1);
  const productEvalGate = userTurnCount >= 5 && (painCount >= 2 || topicsCount >= 3);
  const objectionsGate = userTurnCount >= 6 && productEvalGate;
  const roiGate = userTurnCount >= 8 && topicsCount >= 2 && painCount >= 1;
  const implementationGate = userTurnCount >= 10 && roiGate && hasQuantifiedCue;
  const nextStepsGate =
    userTurnCount >= 12 && implementationGate && (hasClosingCue || interestBucket === "high");

  let stage: ConversationStage = "greeting";
  if (nextStepsGate) stage = "next_steps";
  else if (implementationGate) stage = "implementation";
  else if (roiGate) stage = "roi_discussion";
  else if (objectionsGate) stage = "objections";
  else if (productEvalGate) stage = "product_evaluation";
  else if (painGate) stage = "pain_exploration";
  else if (discoveryGate) stage = "discovery";

  return { stage, guidance: STAGE_GUIDANCE[stage] };
}

export { STAGE_GUIDANCE };

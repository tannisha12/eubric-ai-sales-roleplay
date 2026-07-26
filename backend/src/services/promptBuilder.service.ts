import fs from "node:fs";
import path from "node:path";
import type { PersonaConfig } from "../types/persona";
import type { BuyerState, ConversationMemory } from "../types/conversationState";
import { buildNameOnlyIntroExample, buildInvitationExample } from "./personaEngine.service";

const TEMPLATE_PATH = path.resolve(__dirname, "../../../prompts/system-prompt.md");
const KNOWLEDGE_BASE_PATH = path.resolve(__dirname, "../../../prompts/knowledge/eubric-ai.md");

const KNOWLEDGE_BASE = fs.readFileSync(KNOWLEDGE_BASE_PATH, "utf-8");

function formatMemorySummary(memory: ConversationMemory): string {
  const lines: string[] = [];

  if (memory.salespersonName) lines.push(`The salesperson's name is ${memory.salespersonName}.`);
  if (memory.companyName) lines.push(`They said they're from ${memory.companyName}.`);
  if (memory.keyFactsMentioned.length > 0) {
    lines.push(`Things they've already told you about Eubric AI: ${memory.keyFactsMentioned.join("; ")}.`);
  }
  if (memory.goalsMentioned.length > 0) {
    lines.push(`Goals they've mentioned: ${memory.goalsMentioned.join("; ")}.`);
  }
  if (memory.painPoints.length > 0) {
    lines.push(`Pain points they've surfaced: ${memory.painPoints.join("; ")}.`);
  }
  if (memory.promisedFollowUps.length > 0) {
    lines.push(`Follow-ups they've promised: ${memory.promisedFollowUps.join("; ")}.`);
  }

  if (lines.length === 0) {
    return "You don't have any specific facts about the salesperson or their claims yet - this conversation is just getting started.";
  }

  return `Here is what you already know from this conversation - do not ask for this information again, and reference it naturally when relevant: ${lines.join(" ")}`;
}

function formatQuestionsAlreadyAsked(memory: ConversationMemory): string {
  if (memory.questionsAsked.length === 0) return "";
  return `You've already asked: ${memory.questionsAsked.join(" | ")}. Do not ask these same questions again unless you're intentionally following up on one - ask something new instead.`;
}

function formatObjectionsAlreadyRaised(memory: ConversationMemory): string {
  if (memory.objectionsRaised.length === 0) return "";
  return `You've already raised concerns about: ${memory.objectionsRaised.join(", ")}. Don't raise the identical objection again - move to a different concern or build on what was already discussed.`;
}

function formatObjectionSuggestions(buyerState: BuyerState): string {
  if (buyerState.objectionSuggestions.length === 0) return "";
  return `Objections true to someone in your seat might sound like: "${buyerState.objectionSuggestions.join('" / "')}" - use these as inspiration for the specific, concrete kind of thing you'd actually say, not a script to quote verbatim.`;
}

function formatEndingGuidance(buyerState: BuyerState): string {
  if (buyerState.endingSuggestions.length === 0) return "";
  const isFirm = buyerState.patience.tier === "exhausted";
  const framing = isFirm
    ? "This call is ready to end."
    : "This looks like a natural point where the call could start wrapping up, if it fits the flow.";
  return `${framing} A closing line true to how this call has actually gone might sound like: "${buyerState.endingSuggestions.join('" / "')}" - use one of these as inspiration, in your own words, not a script to quote verbatim. Vary it - don't reach for the same closing line every conversation.${isFirm ? "" : " If the salesperson keeps the conversation going with something substantive, it's fine to keep engaging a bit longer rather than forcing an end this instant."}`;
}

function formatOpeningReplyGuidance(persona: PersonaConfig, buyerState: BuyerState): string {
  if (!buyerState.isOpeningReply) return "";

  const nameOnlyIntro = buildNameOnlyIntroExample(persona);
  const invitationExample = buildInvitationExample();

  return `This is your very first real reply, right after your brief opening greeting - the salesperson has just said who they are on this call. React the way a busy professional actually would: a short, natural pleasantry ("Nice to meet you", "Thanks for calling") and then, if it feels natural this turn, invite them to get to the point - something like "${invitationExample}" or "What can I help you with today?" It's equally fine to leave inviting them for your next reply and just keep this one to the pleasantry. ${nameOnlyIntro ? `If you haven't already given your name in your opening greeting, you can mention it briefly, phrased something like "${nameOnlyIntro}" - otherwise there's no need to repeat it.` : ""} Never thank them for "making the time" or "taking the time" to call - they are the one who called you, not the other way around; a plain pleasantry is enough. Do NOT mention your job title, your company, your current hiring process, pain points, or evaluation criteria yet - none of that until the salesperson actually asks or the conversation naturally calls for it. Keep this reply to 1-3 short sentences, well under 30 words total - never a paragraph.`;
}

function formatDiscoveryInvitationExample(buyerState: BuyerState): string {
  if (buyerState.stage !== "greeting" || buyerState.isOpeningReply) return "";

  return `If you haven't already invited them to get to the point, this is a good moment - something like "${buildInvitationExample()}" or your own phrasing, varied so it doesn't sound identical every conversation. This is a business call, not a leisurely meeting, so don't drag out small talk once introductions are done.`;
}

function formatVariationGuidance(buyerState: BuyerState): string {
  const parts: string[] = [];

  if (buyerState.variation.suggestedOpeners.length > 0) {
    parts.push(
      `To keep your replies sounding natural and not robotic, avoid repeating the same opener - try varying it with something like: ${buyerState.variation.suggestedOpeners.join(", ")}.`
    );
  }

  if (buyerState.variation.suggestInterruption) {
    parts.push(
      `If it feels natural this turn, you may briefly open with something like "${buyerState.variation.suggestedInterruptionPhrases[0] ?? "Sorry to interrupt..."}" - but only if it truly fits, don't force it.`
    );
  }

  if (buyerState.variation.suggestFiller) {
    parts.push(
      `This turn is a reasonable spot for one short acknowledgment like "${buyerState.variation.suggestedFillerPhrases.join('" or "')}" - worked in naturally, not necessarily at the very start of your reply. Skip it entirely if it doesn't genuinely fit.`
    );
  }

  return parts.join(" ");
}

const PLACEHOLDERS: Record<string, (persona: PersonaConfig, buyerState: BuyerState) => string> = {
  "{{KNOWLEDGE_BASE}}": () => KNOWLEDGE_BASE,
  "{{NAME}}": (persona) => persona.name ?? "the buyer",
  "{{ROLE}}": (persona) => persona.role,
  "{{INDUSTRY}}": (persona) => persona.industry,
  "{{COMPANY_SIZE}}": (persona) => persona.companySize,
  "{{BUDGET}}": (persona) => persona.budget,
  "{{DECISION_STYLE}}": (persona) => persona.decisionStyle,
  "{{OBJECTION_STYLE}}": (persona) => persona.objectionStyle,
  "{{COMMUNICATION_STYLE}}": (persona) => persona.communicationStyle,
  "{{DIFFICULTY}}": (persona) => persona.difficulty,
  "{{DIFFICULTY_BEHAVIOR}}": (persona) =>
    persona.difficultyBehavior ?? "Be balanced - raise real objections but don't be unreasonable.",
  "{{PERSONALITY}}": (persona) => persona.personality ?? "Balanced",
  "{{PERSONALITY_TRAITS}}": (persona) => persona.personalityTraits ?? "Even-tempered, reasonable",
  "{{PERSONALITY_BEHAVIOR}}": (persona) =>
    persona.personalityBehavior ??
    "You react proportionally to what's actually said, without a strong bias toward being easy or hard to convince.",
  "{{MOOD}}": (persona) => persona.mood ?? "Neutral",
  "{{MOOD_BEHAVIOR}}": (persona) =>
    persona.moodBehavior ??
    "You're in a normal, professional headspace - neither especially warm nor cold.",
  "{{MOOD_DRIFT_GUIDANCE}}": (_persona, buyerState) => buyerState.moodDrift.guidance,
  "{{CONVERSATION_STAGE}}": (_persona, buyerState) => buyerState.stage.replace(/_/g, " "),
  "{{STAGE_GUIDANCE}}": (_persona, buyerState) => buyerState.stageGuidance,
  "{{ROLE_FOCUS_GUIDANCE}}": (_persona, buyerState) => buyerState.roleFocus.guidance,
  "{{INTEREST_TONE_GUIDANCE}}": (_persona, buyerState) => buyerState.interestToneGuidance,
  "{{PATIENCE_GUIDANCE}}": (_persona, buyerState) => buyerState.patience.guidance,
  "{{MEMORY_SUMMARY}}": (_persona, buyerState) => formatMemorySummary(buyerState.memory),
  "{{QUESTIONS_ALREADY_ASKED}}": (_persona, buyerState) => formatQuestionsAlreadyAsked(buyerState.memory),
  "{{OBJECTIONS_ALREADY_RAISED}}": (_persona, buyerState) =>
    formatObjectionsAlreadyRaised(buyerState.memory),
  "{{OBJECTION_SUGGESTIONS}}": (_persona, buyerState) => formatObjectionSuggestions(buyerState),
  "{{ENDING_GUIDANCE}}": (_persona, buyerState) => formatEndingGuidance(buyerState),
  "{{VARIATION_GUIDANCE}}": (_persona, buyerState) => formatVariationGuidance(buyerState),
  "{{OPENING_REPLY_GUIDANCE}}": (persona, buyerState) => formatOpeningReplyGuidance(persona, buyerState),
  "{{DISCOVERY_INVITATION_EXAMPLE}}": (_persona, buyerState) => formatDiscoveryInvitationExample(buyerState),
};

export function buildSystemPrompt(persona: PersonaConfig, buyerState: BuyerState): string {
  let template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

  for (const [placeholder, resolve] of Object.entries(PLACEHOLDERS)) {
    template = template.split(placeholder).join(resolve(persona, buyerState));
  }

  return template;
}

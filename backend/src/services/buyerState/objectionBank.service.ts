import type { ChatTurn } from "../../types/chat";
import type { RoleFocusCategory } from "../../types/conversationState";

// Concrete, realistic enterprise objections, grouped by the buyer's role focus so a
// technical evaluator and a budget owner push back in ways true to their seat - not
// generic categories like "integration concerns" or "budget freeze", but the specific
// thing that role would actually say, grounded in Eubric AI's real domain (AI hiring
// and interview automation) and its known competitors.
const OBJECTIONS_BY_CATEGORY: Record<RoleFocusCategory, string[]> = {
  hr_people: [
    "Our recruiters already use Greenhouse for this - I'm not sure what this adds.",
    "We just rolled out a new ATS last quarter. I can't ask the team to learn another tool right now.",
    "Our current screening process already covers most of that.",
    "We tried an automated screening tool before and adoption from recruiters was rough.",
    "Candidates might not respond well to being interviewed by an AI instead of a person.",
  ],
  technical: [
    "We already have HireVue in place for structured interviews.",
    "Our security team will need to review this before anything moves forward.",
    "It needs to integrate with our existing HRIS, or it's a non-starter.",
    "We've been burned by vendors that promised integrations they didn't actually have.",
    "I'd want to see how candidate data is stored and who has access to it.",
  ],
  financial: [
    "Our budget for new HR tools is locked until next fiscal year.",
    "We're already evaluating another vendor for this exact use case.",
    "I'll need to see hard ROI numbers before I take this to my VP.",
    "Procurement is going to want a competitive bid, not a single vendor.",
    "We'll need to revisit this next quarter once budgets reopen.",
  ],
  executive: [
    "I'll need leadership approval before we move forward with anything like this.",
    "This isn't a priority for us this quarter - we'll revisit it later.",
    "My leadership team will want to know why this beats what we already have.",
    "We'd need a champion on the recruiting team before I'd sponsor this.",
  ],
  operations: [
    "We just went through a rollout with our current ATS - another change management push is a hard sell.",
    "Our recruiters are already stretched thin during this hiring season.",
    "We'd need a pilot with a small team before rolling this out broadly.",
    "Timing is tough - we're mid-way through a hiring surge already.",
  ],
  general: [
    "We're already evaluating another vendor for this.",
    "We'll need to revisit this next quarter.",
    "I'll need buy-in from a few other stakeholders first.",
    "We've looked at tools like this before and didn't move forward.",
    "Our current process already covers most of that, honestly.",
  ],
};

const OBJECTIONS_PER_TURN = 4;

/**
 * Concrete objection lines appropriate to this buyer's role focus, minus any this
 * conversation has already used (checked against the AI's own past turns), so
 * suggestions stay fresh instead of repeating.
 */
export function getObjectionSuggestions(category: RoleFocusCategory, history: ChatTurn[]): string[] {
  const aiTexts = history.filter((turn) => turn.sender === "ai").map((turn) => turn.text.toLowerCase());
  const alreadyUsed = (objection: string) =>
    aiTexts.some((text) => text.includes(objection.toLowerCase().replace(/[.!?]+$/, "")));

  const pool = Array.from(new Set([...OBJECTIONS_BY_CATEGORY[category], ...OBJECTIONS_BY_CATEGORY.general]));
  const unused = pool.filter((objection) => !alreadyUsed(objection));

  return (unused.length > 0 ? unused : pool).slice(0, OBJECTIONS_PER_TURN);
}

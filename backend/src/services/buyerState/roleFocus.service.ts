import type { RoleFocus, RoleFocusCategory } from "../../types/conversationState";

interface CategoryRule {
  category: RoleFocusCategory;
  keywords: string[];
  guidance: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "hr_people",
    keywords: [
      "hr",
      "human resources",
      "talent acquisition",
      "recruit",
      "people operations",
      "people & culture",
      "campus hiring",
      "chief people officer",
      "chro",
    ],
    guidance:
      "As someone in HR/talent acquisition, prioritize recruiter and hiring-manager adoption, day-to-day workflow impact, candidate experience, and training/rollout support.",
  },
  {
    category: "technical",
    keywords: [
      "cto",
      "chief technology",
      "it security",
      "technology & systems",
      "technology and systems",
      "engineering",
      "architecture",
      "infrastructure",
      "enterprise applications",
    ],
    guidance:
      "As someone in a technical/IT role, prioritize asking about security, data privacy, system architecture, integration with your existing HR tech stack, and scalability - not just business outcomes.",
  },
  {
    category: "financial",
    keywords: [
      "cfo",
      "finance",
      "procurement",
      "budget",
      "financial planning",
      "vendor management",
      "fp&a",
    ],
    guidance:
      "As someone focused on budget, prioritize asking about total cost of ownership, pricing structure, payback period, and procurement terms.",
  },
  {
    category: "executive",
    keywords: ["ceo", "chief executive", "president", "founder"],
    guidance:
      "As a senior executive, prioritize overall business impact, ROI at the organizational level, and competitive advantage - leave technical or line-item budget questions to your team.",
  },
  {
    category: "operations",
    keywords: [
      "operations",
      "ops",
      "implementation",
      "change management",
      "deployment",
      "program management",
    ],
    guidance:
      "As someone focused on operations, prioritize implementation timeline, deployment complexity, change management, and rollout support.",
  },
];

const GENERAL_GUIDANCE =
  "Ask a natural balance of business-value, practical, and implementation questions appropriate to a senior stakeholder evaluating a new HR tech vendor.";

function keywordSpecificity(keyword: string): number {
  // Multi-word phrases are inherently more specific than a single short word, so weight
  // by word count - e.g. "technology & systems" (3 words) should outweigh "hr" (1 word)
  // for a title like "Director of HR Technology & Systems", without letting a merely
  // long single word skew results the way raw character length would.
  return keyword.split(/\s+/).filter(Boolean).length;
}

function countMatches(lowerRole: string, keywords: string[]): number {
  return keywords.reduce((score, keyword) => {
    // Word-boundary match for short/ambiguous keywords (e.g. "hr", "ops") so they don't
    // over-trigger just because a longer, more specific keyword from another category
    // (e.g. "finance", "procurement") also appears in the same role string.
    const pattern = keyword.length <= 3 ? new RegExp(`\\b${keyword}\\b`, "i") : null;
    const isMatch = pattern ? pattern.test(lowerRole) : lowerRole.includes(keyword);
    return score + (isMatch ? keywordSpecificity(keyword) : 0);
  }, 0);
}

export function mapRoleToFocus(role: string): RoleFocus {
  const lowerRole = role.toLowerCase();

  let best: CategoryRule | undefined;
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    const score = countMatches(lowerRole, rule.keywords);
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }

  if (!best) {
    return { category: "general", guidance: GENERAL_GUIDANCE };
  }

  return { category: best.category, guidance: best.guidance };
}

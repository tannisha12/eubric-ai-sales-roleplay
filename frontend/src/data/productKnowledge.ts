export interface ProductSection {
  id: string;
  title: string;
  intro?: string;
  bullets: string[];
}

export interface ProductFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const PRODUCT_SECTIONS: ProductSection[] = [
  {
    id: "features",
    title: "Features",
    intro: "Eubric AI is an AI-powered sales practice platform.",
    bullets: [
      "AI buyer roleplay with realistic customer personas",
      "Live voice conversations",
      "Real-time coaching",
      "Sales scorecards",
      "Discovery, objection-handling, and closing analysis",
    ],
  },
  {
    id: "business-value",
    title: "Business Value",
    intro: "Helps companies:",
    bullets: [
      "Train sales representatives faster",
      "Reduce onboarding time",
      "Improve conversion rates",
      "Practice difficult customer conversations safely",
      "Deliver instant, consistent coaching",
    ],
  },
  {
    id: "demo-highlights",
    title: "Demo Highlights",
    bullets: [
      "Ask discovery questions first",
      "Understand the customer's pain points",
      "Explain value instead of listing features",
      "Handle objections naturally",
      "Always close with a clear next step",
    ],
  },
  {
    id: "pricing-roi",
    title: "Pricing / ROI",
    bullets: [
      "Flexible per-seat pricing that scales with team size",
      "Free pilot available for qualified teams",
      "Most teams see ROI within the first full training cycle",
      "Cuts onboarding time and ramp cost for new reps",
      "No long-term contract required to start a pilot",
    ],
  },
];

export const PRODUCT_FAQ: ProductFaqItem[] = [
  {
    id: "problem-solved",
    question: "What problem does Eubric solve?",
    answer:
      "It helps sales teams practice realistic conversations with an AI buyer before speaking to real customers.",
  },
  {
    id: "who-uses-it",
    question: "Who uses it?",
    answer: "Sales teams, managers, recruiters, and organizations that train customer-facing employees.",
  },
  {
    id: "customization",
    question: "Can conversations be customized?",
    answer: "Yes — buyer personas, industries, and difficulty levels can all be customized.",
  },
  {
    id: "coaching",
    question: "Does it provide coaching?",
    answer:
      "Yes. It evaluates discovery, rapport, confidence, objection handling, communication, and closing.",
  },
  {
    id: "why-not-live-roleplay",
    question: "Why shouldn't we just train using live roleplay with real reps?",
    answer:
      "Live roleplay is valuable but hard to scale — reps get inconsistent practice, managers can't sit in on every session, and mistakes happen with real prospects. Eubric gives every rep unlimited, judgment-free reps with instant, consistent coaching before they ever pick up the phone.",
  },
];

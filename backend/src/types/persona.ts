export interface PersonaConfig {
  name?: string;
  role: string;
  industry: string;
  companySize: string;
  budget: string;
  decisionStyle: string;
  objectionStyle: string;
  communicationStyle: string;
  difficulty: string;
  personality?: string;
  personalityTraits?: string;
  personalityBehavior?: string;
  mood?: string;
  moodBehavior?: string;
  difficultyBehavior?: string;
  // Drives text-to-speech playback only (rate/pitch/pause) - never sent to the LLM.
  speakingStyle?: string;
  speechRate?: number;
  speechPitch?: number;
  speechPauseMs?: number;
  // Buyer-profile detail shown in the Buyer Persona panel (CRM-style fields).
  companyName?: string;
  mainResponsibilities?: string;
  currentChallenges?: string;
  buyingMotivation?: string;
  painPoints?: string;
  successMetrics?: string;
  expectedOutcome?: string;
}

export interface RandomPersonaResponseBody {
  persona: PersonaConfig;
  opening: string;
}

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
}

export interface RandomPersonaResponseBody {
  persona: PersonaConfig;
  opening: string;
}

import type { ChatTurn } from "./chat";
import type { PersonaConfig } from "./persona";

export interface CoachingReportRequestBody {
  conversationHistory: ChatTurn[];
  persona?: PersonaConfig;
}

export interface CoachingReportGrades {
  rapport: number;
  discovery: number;
  objectionHandling: number;
  productKnowledge: number;
  communication: number;
  closing: number;
}

export interface CoachingReportResponseBody {
  overallScore: number;
  grades: CoachingReportGrades;
  strengths: string[];
  improvements: string[];
  missedOpportunities: string[];
  summary: string;
}

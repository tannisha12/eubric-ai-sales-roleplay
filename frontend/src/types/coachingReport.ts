export interface CoachingReportGrades {
  rapport: number;
  discovery: number;
  objectionHandling: number;
  productKnowledge: number;
  communication: number;
  closing: number;
}

export interface CoachingReport {
  overallScore: number;
  grades: CoachingReportGrades;
  strengths: string[];
  improvements: string[];
  missedOpportunities: string[];
  summary: string;
}

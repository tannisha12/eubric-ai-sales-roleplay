import type { CoachingReportGrades } from "../types/coachingReport";

export interface PerformanceMetric {
  label: string;
  value: number;
}

// Which coaching-report grade (0-10) backs each Performance Summary metric (0-100).
// Rapport and Product Knowledge are covered in the full Coaching Report and intentionally
// left out of this condensed summary.
const PERFORMANCE_METRIC_SOURCES: { label: string; grade: keyof CoachingReportGrades }[] = [
  { label: "Confidence", grade: "communication" },
  { label: "Discovery", grade: "discovery" },
  { label: "Objection Handling", grade: "objectionHandling" },
  { label: "Closing", grade: "closing" },
];

const GRADE_SCALE_FACTOR = 10; // grades are 0-10; the Performance Summary shows 0-100

export function derivePerformanceMetrics(grades: CoachingReportGrades): PerformanceMetric[] {
  return PERFORMANCE_METRIC_SOURCES.map(({ label, grade }) => ({
    label,
    value: Math.round(grades[grade] * GRADE_SCALE_FACTOR),
  }));
}

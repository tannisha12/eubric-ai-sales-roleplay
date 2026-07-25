import { useEffect, useState } from "react";
import { ScoreRing } from "./ScoreRing";
import type { CoachingReport, CoachingReportGrades } from "../types/coachingReport";

interface CoachingReportCardProps {
  report: CoachingReport;
}

const GRADE_LABELS: Record<keyof CoachingReportGrades, string> = {
  rapport: "Rapport",
  discovery: "Discovery",
  objectionHandling: "Objection Handling",
  productKnowledge: "Product Knowledge",
  communication: "Communication",
  closing: "Closing",
};

const GRADE_FIELDS = Object.keys(GRADE_LABELS) as (keyof CoachingReportGrades)[];

function severityClass(value: number): string {
  if (value >= 7) return "meter__fill--good";
  if (value >= 4) return "meter__fill--warning";
  return "meter__fill--critical";
}

export function CoachingReportCard({ report }: CoachingReportCardProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, [report]);

  return (
    <div className="card coaching-report-card">
      <h3 className="card__title">Coaching Report</h3>

      <div className="coaching-report-card__header">
        <ScoreRing score={report.overallScore} />
        <p className="coaching-report-card__summary">{report.summary}</p>
      </div>

      <div className="coaching-report-card__section">
        <h4 className="coaching-report-card__section-title">Category Ratings</h4>
        <div className="coaching-report-card__grades">
          {GRADE_FIELDS.map((field) => {
            const value = report.grades[field];
            return (
              <div className="performance-metric" key={field}>
                <div className="performance-metric__header">
                  <span className="performance-metric__label">{GRADE_LABELS[field]}</span>
                  <span className="performance-metric__value">{value.toFixed(1)}/10</span>
                </div>
                <div
                  className="meter"
                  role="progressbar"
                  aria-label={GRADE_LABELS[field]}
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={10}
                >
                  <div className="meter__track">
                    <div
                      className={`meter__fill ${severityClass(value)}`}
                      style={{ width: animated ? `${value * 10}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="coaching-report-card__section">
        <h4 className="coaching-report-card__section-title">Strengths</h4>
        <ul className="coaching-report-card__list">
          {report.strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="coaching-report-card__section">
        <h4 className="coaching-report-card__section-title">Areas to Improve</h4>
        <ul className="coaching-report-card__list">
          {report.improvements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="coaching-report-card__section">
        <h4 className="coaching-report-card__section-title">Missed Opportunities</h4>
        <ul className="coaching-report-card__list">
          {report.missedOpportunities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import type { PerformanceMetric } from "../utils/performanceMetrics";

interface PerformanceCardProps {
  metrics?: PerformanceMetric[];
}

function severityClass(value: number): string {
  if (value >= 70) return "meter__fill--good";
  if (value >= 40) return "meter__fill--warning";
  return "meter__fill--critical";
}

function EmptyStateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="performance-card__empty-icon" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20V10M10 20V4M16 20v-7M4 20h16"
      />
    </svg>
  );
}

export function PerformanceCard({ metrics }: PerformanceCardProps) {
  return (
    <div className="card card--compact performance-card">
      <h3 className="card__title">Performance Summary</h3>

      {metrics ? (
        <div className="performance-card__list">
          {metrics.map((metric) => (
            <div className="performance-metric" key={metric.label}>
              <div className="performance-metric__header">
                <span className="performance-metric__label">{metric.label}</span>
                <span className="performance-metric__value">{metric.value}%</span>
              </div>
              <div
                className="meter"
                role="progressbar"
                aria-label={metric.label}
                aria-valuenow={metric.value}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="meter__track">
                  <div
                    className={`meter__fill ${severityClass(metric.value)}`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="performance-card__empty">
          <EmptyStateIcon />
          <p className="performance-card__empty-text">
            Performance metrics will appear here after your first conversation.
          </p>
        </div>
      )}
    </div>
  );
}

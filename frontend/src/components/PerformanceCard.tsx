interface PerformanceMetric {
  label: string;
  value: number;
}

const DEFAULT_METRICS: PerformanceMetric[] = [
  { label: "Confidence", value: 0 },
  { label: "Objection Handling", value: 0 },
  { label: "Discovery", value: 0 },
  { label: "Closing", value: 0 },
];

interface PerformanceCardProps {
  metrics?: PerformanceMetric[];
}

function severityClass(value: number): string {
  if (value >= 70) return "meter__fill--good";
  if (value >= 40) return "meter__fill--warning";
  return "meter__fill--critical";
}

export function PerformanceCard({ metrics = DEFAULT_METRICS }: PerformanceCardProps) {
  return (
    <div className="card performance-card">
      <h3 className="card__title">Performance Summary</h3>
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
    </div>
  );
}

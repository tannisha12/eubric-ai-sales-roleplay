import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
}

function severityClass(score: number): string {
  if (score >= 70) return "score-ring__progress--good";
  if (score >= 40) return "score-ring__progress--warning";
  return "score-ring__progress--critical";
}

export function ScoreRing({ score, size = 128, label = "Overall Score" }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    setDisplayScore(0);
    const frame = requestAnimationFrame(() => setDisplayScore(clamped));
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  const offset = circumference * (1 - displayScore / 100);

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg
        className="score-ring__svg"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={`${label}: ${clamped} out of 100`}
      >
        <circle
          className="score-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={`score-ring__progress ${severityClass(clamped)}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="score-ring__value">
        <span className="score-ring__number">{clamped}</span>
        <span className="score-ring__label">{label}</span>
      </div>
    </div>
  );
}

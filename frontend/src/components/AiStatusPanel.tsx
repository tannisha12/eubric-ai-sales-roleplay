import type { SessionState } from "../hooks/useSession";

interface AiStatusPanelProps {
  state?: SessionState;
}

const STATUS_LABEL: Record<SessionState, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

export function AiStatusPanel({ state = "idle" }: AiStatusPanelProps) {
  const isActive = state !== "idle";

  return (
    <div className="card ai-status-panel">
      <h3 className="card__title">AI Status</h3>
      <div className={`ai-status-panel__indicator ai-status-panel__indicator--${state}`}>
        <span
          className={`ai-status-panel__dot ${isActive ? "ai-status-panel__dot--pulse" : ""}`}
        />
        <span className="ai-status-panel__label">{STATUS_LABEL[state]}</span>
      </div>
    </div>
  );
}

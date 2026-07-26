import type { SessionState } from "../hooks/useSession";

interface AiStatusPanelProps {
  state?: SessionState;
}

export const STATUS_LABEL: Record<SessionState, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

export function AiStatusPanel({ state = "idle" }: AiStatusPanelProps) {
  const isActive = state !== "idle";

  return (
    <div className="card card--compact ai-status-panel">
      <div className={`ai-status-panel__row ai-status-panel__row--${state}`}>
        <span className="ai-status-panel__title">AI Status</span>
        <span className="ai-status-panel__indicator">
          <span className={`ai-status-panel__dot ${isActive ? "ai-status-panel__dot--pulse" : ""}`} />
          <span className="ai-status-panel__label">{STATUS_LABEL[state]}</span>
        </span>
      </div>
    </div>
  );
}

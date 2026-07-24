interface SessionControlsProps {
  isSessionActive?: boolean;
  onStartSession?: () => void;
  onEndSession?: () => void;
}

export function SessionControls({
  isSessionActive = false,
  onStartSession,
  onEndSession,
}: SessionControlsProps) {
  return (
    <div className="session-controls">
      <button
        type="button"
        className="btn btn--primary"
        disabled={isSessionActive}
        onClick={onStartSession}
      >
        Start Session
      </button>
      <button
        type="button"
        className="btn btn--secondary"
        disabled={!isSessionActive}
        onClick={onEndSession}
      >
        End Session
      </button>
    </div>
  );
}

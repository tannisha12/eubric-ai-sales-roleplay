interface SessionControlsProps {
  isSessionActive?: boolean;
}

export function SessionControls({ isSessionActive = false }: SessionControlsProps) {
  return (
    <div className="session-controls">
      <button type="button" className="btn btn--primary" disabled={isSessionActive}>
        Start Session
      </button>
      <button type="button" className="btn btn--secondary" disabled={!isSessionActive}>
        End Session
      </button>
    </div>
  );
}

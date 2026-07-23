interface MicButtonProps {
  isActive?: boolean;
  disabled?: boolean;
}

export function MicButton({ isActive = false, disabled = false }: MicButtonProps) {
  return (
    <button
      type="button"
      className={`mic-button ${isActive ? "mic-button--active" : ""}`}
      aria-label="Toggle microphone"
      aria-pressed={isActive}
      disabled={disabled}
    >
      <svg viewBox="0 0 24 24" className="mic-button__icon" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        />
        <path
          fill="currentColor"
          d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11Z"
        />
      </svg>
    </button>
  );
}

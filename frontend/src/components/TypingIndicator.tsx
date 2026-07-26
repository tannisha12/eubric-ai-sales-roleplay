interface TypingIndicatorProps {
  label: string;
}

/** Animated three-dot "AI is thinking..." indicator shown while a reply is pending. */
export function TypingIndicator({ label }: TypingIndicatorProps) {
  return (
    <div className="chat-bubble chat-bubble--ai chat-bubble--thinking" aria-live="polite">
      <span className="chat-bubble__sender">AI</span>
      <p className="chat-bubble__text thinking-indicator">
        <span>{label}</span>
        <span className="thinking-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </p>
    </div>
  );
}

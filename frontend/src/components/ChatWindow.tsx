import { useEffect, useRef } from "react";
import { TypingIndicator } from "./TypingIndicator";

export interface ChatMessage {
  sender: "ai" | "user";
  text: string;
}

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  error?: string | null;
  emptyStateMessage?: string;
  emptyStateHint?: string;
  thinkingLabel?: string;
}

function EmptyStateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="chat-window__empty-icon" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4.4 3.3A.5.5 0 0 1 3.8 19V6a1 1 0 0 1 1-1Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        d="M8 9.5h8M8 12.5h5"
      />
    </svg>
  );
}

export function ChatWindow({
  messages,
  isLoading = false,
  error = null,
  emptyStateMessage,
  emptyStateHint,
  thinkingLabel = "AI is thinking...",
}: ChatWindowProps) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  return (
    <div className="card chat-window">
      <h3 className="card__title">Conversation</h3>
      <div className="chat-window__messages">
        {messages.length === 0 && emptyStateMessage && (
          <div className="chat-window__empty">
            <EmptyStateIcon />
            <p className="chat-window__empty-title">{emptyStateMessage}</p>
            {emptyStateHint && <p className="chat-window__empty-hint">{emptyStateHint}</p>}
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-bubble chat-bubble--${message.sender}`}
          >
            <span className="chat-bubble__sender">
              {message.sender === "ai" ? "AI" : "User"}
            </span>
            <p className="chat-bubble__text">{message.text}</p>
          </div>
        ))}

        {isLoading && <TypingIndicator label={thinkingLabel} />}

        <div ref={scrollAnchorRef} />
      </div>

      {error && (
        <p className="chat-window__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

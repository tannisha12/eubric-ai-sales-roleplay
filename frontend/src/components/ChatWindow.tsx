import { useEffect, useRef } from "react";

export interface ChatMessage {
  sender: "ai" | "user";
  text: string;
}

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  error?: string | null;
}

export function ChatWindow({ messages, isLoading = false, error = null }: ChatWindowProps) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  return (
    <div className="card chat-window">
      <h3 className="card__title">Conversation</h3>
      <div className="chat-window__messages">
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

        {isLoading && (
          <div className="chat-bubble chat-bubble--ai chat-bubble--thinking">
            <span className="chat-bubble__sender">AI</span>
            <p className="chat-bubble__text">
              <span className="thinking-dots" aria-label="AI is thinking">
                <span />
                <span />
                <span />
              </span>
            </p>
          </div>
        )}

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

export interface ChatMessage {
  sender: "ai" | "user";
  text: string;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  { sender: "ai", text: "Hello! I'm interested in your product." },
  { sender: "user", text: "Hi, thanks for your time." },
  { sender: "ai", text: "Can you explain pricing?" },
];

interface ChatWindowProps {
  messages?: ChatMessage[];
}

export function ChatWindow({ messages = DEFAULT_MESSAGES }: ChatWindowProps) {
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
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function MessageInput({ onSend, disabled = false, isLoading = false }: MessageInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled || isLoading) {
      return;
    }
    onSend(trimmed);
    setValue("");
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        className="message-input__field"
        placeholder={disabled ? "Start a session to begin typing..." : "Type your response..."}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
        aria-label="Message"
      />
      <button
        type="submit"
        className="btn btn--primary message-input__send"
        disabled={disabled || isLoading || value.trim().length === 0}
      >
        {isLoading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

import { useEffect } from "react";
import "./App.css";
import { AiStatusPanel } from "./components/AiStatusPanel";
import { ChatWindow } from "./components/ChatWindow";
import { Header } from "./components/Header";
import { MessageInput } from "./components/MessageInput";
import { MicButton } from "./components/MicButton";
import { PerformanceCard } from "./components/PerformanceCard";
import { PersonaCard } from "./components/PersonaCard";
import { SessionControls } from "./components/SessionControls";
import { useChat } from "./hooks/useChat";
import { useSession } from "./hooks/useSession";
import type { SessionState } from "./hooks/useSession";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";

type MicStatus = "listening" | "processing" | "idle";

const MIC_STATUS_LABEL: Record<MicStatus, string> = {
  listening: "🎤 Listening",
  processing: "⏳ Processing",
  idle: "⭕ Idle",
};

function App() {
  const { isSessionActive, startSession, endSession } = useSession();
  const { messages, isLoading, error, sendMessage, resetChat } = useChat();
  const {
    isListening,
    interimTranscript,
    finalTranscript,
    error: speechError,
    browserSupported,
    start: startListening,
    stop: stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const aiState: SessionState = isLoading ? "thinking" : isSessionActive ? "listening" : "idle";

  const micStatus: MicStatus = !isSessionActive ? "idle" : isLoading ? "processing" : isListening ? "listening" : "idle";

  useEffect(() => {
    if (!finalTranscript) {
      return;
    }
    sendMessage(finalTranscript);
    resetTranscript();
  }, [finalTranscript, sendMessage, resetTranscript]);

  function handleStartSession() {
    resetChat();
    resetTranscript();
    startSession();
    if (browserSupported) {
      startListening();
    }
  }

  function handleEndSession() {
    stopListening();
    endSession();
  }

  return (
    <div className="app-shell">
      <Header status={isSessionActive ? "online" : "offline"} />

      <main className="app-main">
        <section className="app-main__primary">
          <div className="card practice-card">
            <h1 className="practice-card__title">AI Sales Practice</h1>
            <p className="practice-card__subtitle">
              Practice conversations with an AI buyer.
            </p>
            <MicButton isActive={isListening} disabled={!isSessionActive || !browserSupported} />
            <p className="mic-status" aria-live="polite">
              {MIC_STATUS_LABEL[micStatus]}
            </p>
            {isSessionActive && interimTranscript && (
              <p className="mic-transcript">{interimTranscript}</p>
            )}
            {!browserSupported && (
              <p className="mic-status mic-status--warning" role="alert">
                Speech recognition isn't supported in this browser. Try Chrome or Edge, or type your
                response below.
              </p>
            )}
            {speechError && (
              <p className="mic-status mic-status--warning" role="alert">
                {speechError}
              </p>
            )}
            <SessionControls
              isSessionActive={isSessionActive}
              onStartSession={handleStartSession}
              onEndSession={handleEndSession}
            />
          </div>

          <ChatWindow messages={messages} isLoading={isLoading} error={error} />
          <MessageInput onSend={sendMessage} disabled={!isSessionActive} isLoading={isLoading} />
        </section>

        <aside className="app-main__sidebar">
          <AiStatusPanel state={aiState} />
          <PersonaCard />
          <PerformanceCard />
        </aside>
      </main>
    </div>
  );
}

export default App;

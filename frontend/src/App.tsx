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

function App() {
  const { isSessionActive, startSession, endSession } = useSession();
  const { messages, isLoading, error, sendMessage, resetChat } = useChat();

  const aiState: SessionState = isLoading ? "thinking" : isSessionActive ? "listening" : "idle";

  function handleStartSession() {
    resetChat();
    startSession();
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
            <MicButton isActive={isSessionActive} />
            <SessionControls
              isSessionActive={isSessionActive}
              onStartSession={handleStartSession}
              onEndSession={endSession}
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

import "./App.css";
import { AiStatusPanel } from "./components/AiStatusPanel";
import { ChatWindow } from "./components/ChatWindow";
import { Header } from "./components/Header";
import { MicButton } from "./components/MicButton";
import { PerformanceCard } from "./components/PerformanceCard";
import { PersonaCard } from "./components/PersonaCard";
import { SessionControls } from "./components/SessionControls";
import { useSession } from "./hooks/useSession";

function App() {
  const { sessionState, isSessionActive, transcript, startSession, endSession } =
    useSession();

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
            <MicButton isActive={sessionState !== "idle"} />
            <SessionControls
              isSessionActive={isSessionActive}
              onStartSession={startSession}
              onEndSession={endSession}
            />
          </div>

          <ChatWindow messages={transcript} />
        </section>

        <aside className="app-main__sidebar">
          <AiStatusPanel state={sessionState} />
          <PersonaCard />
          <PerformanceCard />
        </aside>
      </main>
    </div>
  );
}

export default App;

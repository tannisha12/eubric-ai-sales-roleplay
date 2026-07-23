import "./App.css";
import { ChatWindow } from "./components/ChatWindow";
import { Header } from "./components/Header";
import { MicButton } from "./components/MicButton";
import { PerformanceCard } from "./components/PerformanceCard";
import { PersonaCard } from "./components/PersonaCard";
import { SessionControls } from "./components/SessionControls";

function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <section className="app-main__primary">
          <div className="card practice-card">
            <h1 className="practice-card__title">AI Sales Practice</h1>
            <p className="practice-card__subtitle">
              Practice conversations with an AI buyer.
            </p>
            <MicButton />
            <SessionControls />
          </div>

          <ChatWindow />
        </section>

        <aside className="app-main__sidebar">
          <PersonaCard />
          <PerformanceCard />
        </aside>
      </main>
    </div>
  );
}

export default App;

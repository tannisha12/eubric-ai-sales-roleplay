import { useEffect, useRef, useState } from "react";
import "./App.css";
import { AiStatusPanel } from "./components/AiStatusPanel";
import { ChatWindow } from "./components/ChatWindow";
import { CoachingReportCard } from "./components/CoachingReportCard";
import { Header } from "./components/Header";
import { MessageInput } from "./components/MessageInput";
import { MicButton } from "./components/MicButton";
import { PerformanceCard } from "./components/PerformanceCard";
import { PersonaCard } from "./components/PersonaCard";
import type { DifficultyLevel } from "./components/PersonaCard";
import { SessionControls } from "./components/SessionControls";
import { DEFAULT_PERSONA, useChat } from "./hooks/useChat";
import { useSession } from "./hooks/useSession";
import type { SessionState } from "./hooks/useSession";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useTextToSpeech } from "./hooks/useTextToSpeech";
import { CoachingReportApiError, fetchCoachingReport } from "./services/coachingReportApi";
import { fetchRandomPersona, PersonaApiError } from "./services/personaApi";
import type { CoachingReport } from "./types/coachingReport";
import type { PersonaConfig } from "./types/persona";

type MicStatus = "listening" | "processing" | "idle";

const MIC_STATUS_LABEL: Record<MicStatus, string> = {
  listening: "🎤 Listening",
  processing: "⏳ Processing",
  idle: "⭕ Idle",
};

const DIFFICULTY_LEVELS: DifficultyLevel[] = ["Easy", "Medium", "Hard", "Expert"];

function toDifficultyLevel(value: string): DifficultyLevel {
  return (DIFFICULTY_LEVELS as string[]).includes(value) ? (value as DifficultyLevel) : "Medium";
}

function App() {
  const { isSessionActive, startSession, endSession } = useSession();
  const [persona, setPersona] = useState<PersonaConfig>(DEFAULT_PERSONA);
  const [personaError, setPersonaError] = useState<string | null>(null);
  const { messages, isLoading, error, sendMessage, resetChat } = useChat(persona);
  const [coachingReport, setCoachingReport] = useState<CoachingReport | null>(null);
  const [isCoachingReportLoading, setIsCoachingReportLoading] = useState(false);
  const [coachingReportError, setCoachingReportError] = useState<string | null>(null);
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
  const {
    isSpeaking,
    isSupported: speechSynthesisSupported,
    error: speechSynthesisError,
    speak,
    stop: stopSpeaking,
  } = useTextToSpeech();

  const aiState: SessionState = isLoading
    ? "thinking"
    : isSpeaking
    ? "speaking"
    : isSessionActive
    ? "listening"
    : "idle";

  const micStatus: MicStatus = !isSessionActive ? "idle" : isLoading ? "processing" : isListening ? "listening" : "idle";

  useEffect(() => {
    if (!finalTranscript) {
      return;
    }
    sendMessage(finalTranscript);
    resetTranscript();
  }, [finalTranscript, sendMessage, resetTranscript]);

  const prevMessageCountRef = useRef(messages.length);

  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (messages.length !== prevCount + 1) {
      return;
    }

    const latestMessage = messages[messages.length - 1];
    if (latestMessage.sender === "ai") {
      speak(latestMessage.text);
    }
  }, [messages, speak]);

  async function handleStartSession() {
    stopSpeaking();
    resetTranscript();
    setCoachingReport(null);
    setCoachingReportError(null);
    setPersonaError(null);

    let nextPersona = DEFAULT_PERSONA;
    let opening = "Hello! I'm the Healthcare CTO joining today. I'd love to hear about Eubric AI.";

    try {
      const random = await fetchRandomPersona();
      nextPersona = random.persona;
      opening = random.opening;
    } catch (err) {
      setPersonaError(
        err instanceof PersonaApiError
          ? err.message
          : "Could not load a new buyer persona. Using the default persona instead."
      );
    }

    setPersona(nextPersona);
    resetChat(opening);
    startSession();
    speak(opening);
    if (browserSupported) {
      startListening();
    }
  }

  async function handleEndSession() {
    stopListening();
    stopSpeaking();
    endSession();

    if (messages.length < 2) {
      return;
    }

    setIsCoachingReportLoading(true);
    setCoachingReportError(null);

    try {
      const report = await fetchCoachingReport(messages, persona);
      setCoachingReport(report);
    } catch (err) {
      setCoachingReportError(
        err instanceof CoachingReportApiError
          ? err.message
          : "Could not generate a coaching report. Please try again."
      );
    } finally {
      setIsCoachingReportLoading(false);
    }
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
            {isSpeaking && (
              <p className="mic-status" aria-live="polite">
                🔊 AI Speaking...
              </p>
            )}
            {!speechSynthesisSupported && (
              <p className="mic-status mic-status--warning" role="alert">
                Voice responses aren't supported in this browser. AI replies will still appear as
                text.
              </p>
            )}
            {speechSynthesisError && (
              <p className="mic-status mic-status--warning" role="alert">
                {speechSynthesisError}
              </p>
            )}
            {personaError && (
              <p className="mic-status mic-status--warning" role="alert">
                {personaError}
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

          {isCoachingReportLoading && (
            <div className="card coaching-report-loading" aria-live="polite">
              <span className="spinner" aria-hidden="true" />
              <p className="mic-status">Generating your coaching report...</p>
            </div>
          )}
          {coachingReportError && (
            <p className="mic-status mic-status--warning" role="alert">
              {coachingReportError}
            </p>
          )}
          {coachingReport && <CoachingReportCard report={coachingReport} />}
        </section>

        <aside className="app-main__sidebar">
          <AiStatusPanel state={aiState} />
          <PersonaCard
            buyerPersona={persona.name ? `${persona.name} - ${persona.role}` : persona.role}
            difficulty={toDifficultyLevel(persona.difficulty)}
            industry={persona.industry}
            personality={persona.personality}
            mood={persona.mood}
          />
          <PerformanceCard />
        </aside>
      </main>
    </div>
  );
}

export default App;

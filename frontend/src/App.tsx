import { useEffect, useRef, useState } from "react";
import "./App.css";
import { AiStatusPanel, STATUS_LABEL } from "./components/AiStatusPanel";
import { ChatWindow } from "./components/ChatWindow";
import { CoachingReportCard } from "./components/CoachingReportCard";
import { Header } from "./components/Header";
import { MessageInput } from "./components/MessageInput";
import { MicButton } from "./components/MicButton";
import { PerformanceCard } from "./components/PerformanceCard";
import { PersonaCard } from "./components/PersonaCard";
import type { DifficultyLevel } from "./components/PersonaCard";
import { SalesAssistantCard } from "./components/SalesAssistantCard";
import { SessionControls } from "./components/SessionControls";
import { SessionOnboarding } from "./components/SessionOnboarding";
import { DEFAULT_PERSONA, useChat } from "./hooks/useChat";
import { useSession } from "./hooks/useSession";
import type { SessionState } from "./hooks/useSession";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useTextToSpeech } from "./hooks/useTextToSpeech";
import { CoachingReportApiError, fetchCoachingReport } from "./services/coachingReportApi";
import { fetchRandomPersona, PersonaApiError } from "./services/personaApi";
import type { CoachingReport } from "./types/coachingReport";
import type { PersonaConfig } from "./types/persona";
import { derivePerformanceMetrics } from "./utils/performanceMetrics";
import { getThinkingLabel } from "./utils/thinkingIndicator";
import { shouldSendTranscript } from "./utils/transcriptProcessing";

const UNCLEAR_TRANSCRIPT_MESSAGE = "I couldn't clearly understand that. Please try again.";
const FALLBACK_OPENING_GREETING = "Hello!";

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
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const {
    isListening,
    interimTranscript,
    finalTranscript,
    finalTranscriptConfidence,
    error: speechError,
    browserSupported,
    start: startListening,
    stop: stopListening,
    resetTranscript,
  } = useSpeechRecognition();
  const lastSentTranscriptRef = useRef<string | null>(null);
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

  const voiceReady = browserSupported && speechSynthesisSupported;
  const progressLabel =
    !isSessionActive && messages.length === 0
      ? "Not started"
      : `${messages.length} message${messages.length === 1 ? "" : "s"}`;

  useEffect(() => {
    if (!finalTranscript) {
      return;
    }

    const { shouldSend, normalizedTranscript } = shouldSendTranscript(
      finalTranscript,
      finalTranscriptConfidence ?? undefined,
      lastSentTranscriptRef.current
    );
    resetTranscript();

    if (!shouldSend) {
      setTranscriptError(UNCLEAR_TRANSCRIPT_MESSAGE);
      return;
    }

    setTranscriptError(null);
    lastSentTranscriptRef.current = normalizedTranscript;
    sendMessage(normalizedTranscript);
  }, [finalTranscript, finalTranscriptConfidence, sendMessage, resetTranscript]);

  const prevMessageCountRef = useRef(messages.length);

  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (messages.length !== prevCount + 1) {
      return;
    }

    const latestMessage = messages[messages.length - 1];
    if (latestMessage.sender === "ai") {
      speak(latestMessage.text, {
        rate: persona.speechRate,
        pitch: persona.speechPitch,
        pauseMs: persona.speechPauseMs,
      });
    }
  }, [messages, speak, persona]);

  async function handleStartSession() {
    stopSpeaking();
    resetTranscript();
    lastSentTranscriptRef.current = null;
    setCoachingReport(null);
    setCoachingReportError(null);
    setPersonaError(null);
    setTranscriptError(null);

    let nextPersona = DEFAULT_PERSONA;
    let openingGreeting = FALLBACK_OPENING_GREETING;

    try {
      const random = await fetchRandomPersona();
      nextPersona = random.persona;
      openingGreeting = random.opening;
    } catch (err) {
      setPersonaError(
        err instanceof PersonaApiError
          ? err.message
          : "Could not load a new buyer persona. Using the default persona instead."
      );
    }

    setPersona(nextPersona);
    // The greeting becomes the first message in the transcript, so re-sync the
    // "message just added" counter to match - otherwise it won't be spoken aloud.
    prevMessageCountRef.current = 0;
    resetChat(openingGreeting);
    startSession();
    if (browserSupported) {
      startListening();
    }
  }

  async function handleEndSession() {
    stopListening();
    stopSpeaking();
    endSession();

    // messages[0] is the seeded opening greeting, not a real exchange - require at
    // least a salesperson turn and an AI reply on top of it before reporting.
    if (messages.length < 3) {
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
            <div className="practice-card__top">
              <span className="eyebrow">Live Practice Session</span>
              <h1 className="practice-card__title">AI Sales Practice</h1>
              <p className="practice-card__subtitle">Practice conversations with an AI buyer.</p>
            </div>

            <div className="practice-card__stats">
              <div className="practice-card__stat">
                <span className="eyebrow">Status</span>
                <span className="practice-card__stat-value">{STATUS_LABEL[aiState]}</span>
              </div>
              <div className="practice-card__stat-divider" aria-hidden="true" />
              <div className="practice-card__stat">
                <span className="eyebrow">Buyer</span>
                <span className="practice-card__stat-value">{persona.name ?? persona.role}</span>
              </div>
              <div className="practice-card__stat-divider" aria-hidden="true" />
              <div className="practice-card__stat">
                <span className="eyebrow">Progress</span>
                <span className="practice-card__stat-value">{progressLabel}</span>
              </div>
              <div className="practice-card__stat-divider" aria-hidden="true" />
              <div className="practice-card__stat">
                <span className="eyebrow">Voice</span>
                <span className="practice-card__stat-value">
                  {voiceReady ? "Ready" : "Text Only"}
                </span>
              </div>
            </div>

            <div className="practice-card__mic-zone">
              <MicButton isActive={isListening} disabled={!isSessionActive || !browserSupported} />
              <p className="mic-status" aria-live="polite">
                {MIC_STATUS_LABEL[micStatus]}
              </p>
              {isSessionActive && interimTranscript && (
                <p className="mic-transcript">{interimTranscript}</p>
              )}
              {!browserSupported && (
                <p className="mic-status mic-status--warning" role="alert">
                  Speech recognition isn't supported in this browser. Try Chrome or Edge, or type
                  your response below.
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
              {transcriptError && (
                <p className="mic-status mic-status--warning" role="alert">
                  {transcriptError}
                </p>
              )}
              <SessionControls
                isSessionActive={isSessionActive}
                onStartSession={handleStartSession}
                onEndSession={handleEndSession}
              />
            </div>
          </div>

          {!isSessionActive && <SessionOnboarding difficulty={persona.difficulty} />}

          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            error={error}
            emptyStateMessage={!isSessionActive ? "Your conversation will appear here" : undefined}
            emptyStateHint={
              !isSessionActive
                ? "Start a session and your AI buyer will open the conversation. Respond by voice or by typing below."
                : undefined
            }
            thinkingLabel={getThinkingLabel(persona)}
          />
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
          <PersonaCard persona={persona} difficulty={toDifficultyLevel(persona.difficulty)} />
          <SalesAssistantCard persona={persona} />
          <PerformanceCard
            metrics={coachingReport ? derivePerformanceMetrics(coachingReport.grades) : undefined}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;

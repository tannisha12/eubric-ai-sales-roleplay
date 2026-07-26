import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSpeechRecognitionResult {
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  finalTranscriptConfidence: number | null;
  error: string | null;
  browserSupported: boolean;
  start: () => void;
  stop: () => void;
  resetTranscript: () => void;
}

// How long to wait after the user stops producing any recognition results (interim or
// final) before treating their turn as finished. Resets on every new result, so a brief
// mid-thought pause doesn't cut the speaker off.
const SILENCE_TIMEOUT_MS = 1500;

const ERROR_MESSAGES: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  "not-allowed": "Microphone access was denied. Please allow microphone permissions and try again.",
  "audio-capture": "No microphone was found. Please connect a microphone and try again.",
  network: "A network error interrupted speech recognition.",
  "service-not-allowed": "Speech recognition service is not allowed in this browser.",
  "language-not-supported": "The selected language is not supported for speech recognition.",
};

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

function averageConfidence(samples: number[]): number | null {
  if (samples.length === 0) return null;
  return samples.reduce((sum, value) => sum + value, 0) / samples.length;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const RecognitionCtor = getSpeechRecognitionConstructor();
  const browserSupported = Boolean(RecognitionCtor);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);

  // Accumulates everything recognized for the speaking turn currently in progress, so a
  // turn made of several browser-level "final" chunks is still committed only once.
  const accumulatedFinalRef = useRef("");
  const latestInterimRef = useRef("");
  const confidenceSamplesRef = useRef<number[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [finalTranscriptConfidence, setFinalTranscriptConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetTurnState = useCallback(() => {
    clearSilenceTimer();
    accumulatedFinalRef.current = "";
    latestInterimRef.current = "";
    confidenceSamplesRef.current = [];
  }, [clearSilenceTimer]);

  useEffect(() => {
    if (!RecognitionCtor) {
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    const commitTurn = () => {
      silenceTimerRef.current = null;

      const committed = accumulatedFinalRef.current.trim() || latestInterimRef.current.trim();
      const confidence = averageConfidence(confidenceSamplesRef.current);

      accumulatedFinalRef.current = "";
      latestInterimRef.current = "";
      confidenceSamplesRef.current = [];
      setInterimTranscript("");

      if (committed) {
        setFinalTranscript(committed);
        setFinalTranscriptConfidence(confidence);
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalChunk += transcript;
          if (typeof result[0].confidence === "number") {
            confidenceSamplesRef.current.push(result[0].confidence);
          }
        } else {
          interim += transcript;
        }
      }

      if (finalChunk.trim()) {
        accumulatedFinalRef.current = `${accumulatedFinalRef.current} ${finalChunk}`.trim();
      }
      latestInterimRef.current = interim;
      setInterimTranscript(interim);

      // Any new activity (even interim) means the speaker hasn't finished - push the
      // silence deadline back out instead of finalizing immediately.
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(commitTurn, SILENCE_TIMEOUT_MS);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      setError(ERROR_MESSAGES[event.error] ?? "Speech recognition encountered an error.");
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldListenRef.current = false;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          // Recognition may already be starting; ignore.
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      resetTurnState();
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [RecognitionCtor, clearSilenceTimer, resetTurnState]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setError(null);
    setInterimTranscript("");
    setFinalTranscript("");
    setFinalTranscriptConfidence(null);
    resetTurnState();
    shouldListenRef.current = true;

    try {
      recognition.start();
    } catch {
      // start() throws if recognition is already active; safe to ignore.
    }
  }, [resetTurnState]);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    resetTurnState();
    recognitionRef.current?.stop();
  }, [resetTurnState]);

  const resetTranscript = useCallback(() => {
    resetTurnState();
    setFinalTranscript("");
    setFinalTranscriptConfidence(null);
    setInterimTranscript("");
  }, [resetTurnState]);

  return {
    isListening,
    interimTranscript,
    finalTranscript,
    finalTranscriptConfidence,
    error,
    browserSupported,
    start,
    stop,
    resetTranscript,
  };
}

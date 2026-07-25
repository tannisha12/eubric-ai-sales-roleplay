import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSpeechRecognitionResult {
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  browserSupported: boolean;
  start: () => void;
  stop: () => void;
  resetTranscript: () => void;
}

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

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const RecognitionCtor = getSpeechRecognitionConstructor();
  const browserSupported = Boolean(RecognitionCtor);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!RecognitionCtor) {
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
      if (final.trim()) {
        setFinalTranscript(final.trim());
      }
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
      setInterimTranscript("");
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
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [RecognitionCtor]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setError(null);
    setInterimTranscript("");
    setFinalTranscript("");
    shouldListenRef.current = true;

    try {
      recognition.start();
    } catch {
      // start() throws if recognition is already active; safe to ignore.
    }
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  const resetTranscript = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    browserSupported,
    start,
    stop,
    resetTranscript,
  };
}

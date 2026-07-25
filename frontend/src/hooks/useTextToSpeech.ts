import { useCallback, useEffect, useRef, useState } from "react";

export interface UseTextToSpeechResult {
  isSpeaking: boolean;
  isSupported: boolean;
  error: string | null;
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en") && voice.default) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
  );
}

export function useTextToSpeech(): UseTextToSpeechResult {
  const isSupported = isSpeechSynthesisSupported();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    function loadVoices() {
      voicesRef.current = window.speechSynthesis.getVoices();
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      if (!isSupported) {
        setError("Text-to-speech isn't supported in this browser.");
        return;
      }

      setError(null);
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const preferredVoice = pickEnglishVoice(voicesRef.current);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        setIsSpeaking(false);
        if (event.error !== "canceled" && event.error !== "interrupted") {
          setError("Speech playback failed. Please try again.");
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.pause();
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.resume();
  }, [isSupported]);

  return { isSpeaking, isSupported, error, speak, stop, pause, resume };
}

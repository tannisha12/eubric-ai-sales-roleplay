import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechStyle {
  rate?: number;
  pitch?: number;
  pauseMs?: number;
}

export interface UseTextToSpeechResult {
  isSpeaking: boolean;
  isSupported: boolean;
  error: string | null;
  speak: (text: string, style?: SpeechStyle) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

// Sensible fallbacks when a persona has no configured speaking style.
const DEFAULT_RATE = 1.0;
const DEFAULT_PITCH = 1.0;
const DEFAULT_PAUSE_MS = 200;

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en") && voice.default) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
  );
}

// The Web Speech API has no inline "pause between clauses" markup, so a persona's
// pauses are simulated by splitting the reply into sentences and speaking them as
// separate utterances with a timed gap in between - the gap length is what actually
// varies per speaking style (a "Slow"/"Analytical" persona leaves a longer gap than a
// "Fast"/"Energetic" one).
function splitIntoSentences(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.length > 0 ? sentences : [text.trim()];
}

export function useTextToSpeech(): UseTextToSpeechResult {
  const isSupported = isSpeechSynthesisSupported();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearPauseTimer = useCallback(() => {
    if (pauseTimerRef.current !== null) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, style?: SpeechStyle) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      if (!isSupported) {
        setError("Text-to-speech isn't supported in this browser.");
        return;
      }

      setError(null);
      clearPauseTimer();
      window.speechSynthesis.cancel();

      const rate = style?.rate ?? DEFAULT_RATE;
      const pitch = style?.pitch ?? DEFAULT_PITCH;
      const pauseMs = style?.pauseMs ?? DEFAULT_PAUSE_MS;
      const preferredVoice = pickEnglishVoice(voicesRef.current);

      const sentences = splitIntoSentences(trimmed);
      setIsSpeaking(true);

      const speakSentence = (index: number) => {
        if (index >= sentences.length) {
          setIsSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(sentences[index]);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = 1.0;
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
          if (index + 1 >= sentences.length) {
            setIsSpeaking(false);
            return;
          }
          pauseTimerRef.current = setTimeout(() => speakSentence(index + 1), pauseMs);
        };
        utterance.onerror = (event) => {
          setIsSpeaking(false);
          if (event.error !== "canceled" && event.error !== "interrupted") {
            setError("Speech playback failed. Please try again.");
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      speakSentence(0);
    },
    [isSupported, clearPauseTimer]
  );

  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }
    clearPauseTimer();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported, clearPauseTimer]);

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

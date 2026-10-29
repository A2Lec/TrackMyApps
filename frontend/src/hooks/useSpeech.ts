import { useState, useEffect, useRef, useCallback } from 'react';

// Define SpeechRecognition types for browsers that support it
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalStr += result[0].transcript + ' ';
        } else {
          interimStr += result[0].transcript;
        }
      }

      if (finalStr) {
        setTranscript((prev) => {
          const updated = prev ? `${prev.trim()} ${finalStr.trim()}` : finalStr.trim();
          transcriptRef.current = updated;
          return updated;
        });
      }
      setInterimTranscript(interimStr);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // Ignore cleanup
      }
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
    } catch {
      // Already started: the browser throws InvalidStateError
    }
  }, [isListening]);

  const stopListening = useCallback((): string => {
    if (!recognitionRef.current || !isListening) return transcriptRef.current;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch {
      // Already stopped
    }
    return transcriptRef.current;
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    transcriptRef.current = '';
    setInterimTranscript('');
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
    getCurrentTranscript: () => transcriptRef.current,
  };
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.15); // Dynamic natural cadence (1.15x is ideal for fluid French)

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load and cache voices when the browser engine updates them
  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  // List of all available French voices
  const frenchVoices = availableVoices.filter(
    (v) => v.lang === 'fr-FR' || v.lang.startsWith('fr')
  );

  // Select the highest quality natural/neural French voice available
  const getBestFrenchVoice = useCallback((): SpeechSynthesisVoice | null => {
    const list = frenchVoices.length > 0
      ? frenchVoices
      : typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices().filter((v) => v.lang === 'fr-FR' || v.lang.startsWith('fr'))
        : [];

    if (!list.length) return null;

    // 1. Natural / Neural online voices (Edge / Chrome / macOS)
    const natural = list.find((v) =>
      /natural|neural|online|google|premium/i.test(v.name)
    );
    if (natural) return natural;

    // 2. High-quality non-desktop offline voices
    const nonDesktop = list.find((v) => !/desktop/i.test(v.name));
    if (nonDesktop) return nonDesktop;

    // 3. Fallback
    return list[0];
  }, [frenchVoices]);

  // Active voice: user selected or best detected
  const activeVoice =
    frenchVoices.find((v) => v.voiceURI === selectedVoiceURI) || getBestFrenchVoice();

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  const speak = useCallback(
    (
      text: string,
      options?: { rate?: number; pitch?: number; onEnd?: () => void } | (() => void)
    ) => {
      if (!isSupported || !text) return;

      const opts = typeof options === 'function' ? { onEnd: options } : options;

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      // Clean markdown symbols & phonetic acronyms for fluid spoken French
      const cleanedText = text
        // Strip markdown headings (###, ##, #)
        .replace(/^#{1,6}\s+/gm, '')
        // Strip code blocks and inline code
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        // Strip bold, italics, strikethrough
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/~~(.*?)~~/g, '$1')
        // Strip markdown links [title](url) -> title
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Strip list bullets and numbered prefixes at start of line
        .replace(/^\s*[*\-+]\s+/gm, '')
        .replace(/^\s*\d+[.)]\s+/gm, '')
        // Strip blockquotes
        .replace(/^\s*>\s*/gm, '')
        // Convert French & Tech abbreviations into spoken form
        .replace(/\b(API)\b/gi, 'A P I')
        .replace(/\b(RH)\b/gi, 'R H')
        .replace(/\b(CV)\b/gi, 'C V')
        .replace(/\b(CTO)\b/gi, 'C T O')
        .replace(/\b(CEO)\b/gi, 'C E O')
        .replace(/\b(CDI)\b/gi, 'C D I')
        .replace(/\b(CDD)\b/gi, 'C D D')
        .replace(/\b(IA)\b/gi, 'I A')
        .replace(/\b(ESN)\b/gi, 'E S N')
        .replace(/\b(SaaS)\b/gi, 'Saas')
        .replace(/\b(B2B)\b/gi, 'B to B')
        .replace(/\b(B2C)\b/gi, 'B to C')
        .replace(/\b(KPI)\b/gi, 'K P I')
        .replace(/\b(QA)\b/gi, 'Q A')
        .replace(/\b(PR)\b/gi, 'Pull Request')
        .replace(/\b(e\.g\.|ex:)\b/gi, 'par exemple')
        .replace(/\b(c\.-\s*à\s*-d\.|i\.e\.)\b/gi, "c'est-à-dire")
        .replace(/\b(React\.js|ReactJS)\b/gi, 'React')
        .replace(/\b(Node\.js|NodeJS)\b/gi, 'Node')
        // Normalize whitespace and multiple punctuation marks
        .replace(/\.{2,}/g, '.')
        .replace(/!{2,}/g, '!')
        .replace(/\?{2,}/g, '?')
        .replace(/\n+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = 'fr-FR';

      // Dynamic pacing: default 1.15 for lively human tempo
      utterance.rate = opts?.rate || speechRate;
      utterance.pitch = opts?.pitch || 1.02; // Warm, natural conversational pitch

      if (activeVoice) {
        utterance.voice = activeVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        opts?.onEnd?.();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, speechRate, activeVoice]
  );

  return {
    isSupported,
    isSpeaking,
    isPaused,
    speechRate,
    setSpeechRate,
    frenchVoices,
    activeVoice,
    selectedVoiceURI,
    setSelectedVoiceURI,
    speak,
    stop,
  };
}

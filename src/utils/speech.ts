import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppLanguage } from '../types';

export type SpeechPlaybackState = 'idle' | 'speaking' | 'paused';

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function pickVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  lang: AppLanguage
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const targetPrefix = lang === 'hi' ? 'hi' : 'en';
  const preferredRegional = lang === 'hi' ? 'hi-in' : 'en-in';

  return (
    voices.find((v) => v.lang.toLowerCase() === preferredRegional) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix)) ||
    null
  );
}

export function useSpeechSynthesis(lang: AppLanguage) {
  const supported = isSpeechSynthesisSupported();
  const [state, setState] = useState<SpeechPlaybackState>('idle');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      try {
        setVoices(window.speechSynthesis.getVoices());
      } catch {
        setVoices([]);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
    utteranceRef.current = null;
    setState('idle');
    setActiveKey(null);
  }, [supported]);

  // Stop speech cleanly if user switches language
  useEffect(() => {
    stop();
  }, [lang, stop]);

  const play = useCallback(
    (text: string, key = 'default') => {
      if (!supported || !text.trim()) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
        utterance.rate = 0.92; // Slightly calmer, clearer pace for elderly listeners
        const matchedVoice = pickVoiceForLanguage(voices, lang);
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
        utterance.onend = () => {
          setState('idle');
          setActiveKey(null);
        };
        utterance.onerror = () => {
          setState('idle');
          setActiveKey(null);
        };
        utteranceRef.current = utterance;
        setActiveKey(key);
        setState('speaking');
        window.speechSynthesis.speak(utterance);
      } catch {
        setState('idle');
        setActiveKey(null);
      }
    },
    [lang, supported, voices]
  );

  const pause = useCallback(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.pause();
      setState('paused');
    } catch {
      // Ignore
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.resume();
      setState('speaking');
    } catch {
      // Ignore
    }
  }, [supported]);

  const hasMatchingVoice = Boolean(pickVoiceForLanguage(voices, lang));

  return {
    supported,
    hasMatchingVoice,
    state,
    activeKey,
    play,
    pause,
    resume,
    stop,
  };
}

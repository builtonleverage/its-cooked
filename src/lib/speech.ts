import { useEffect, useState } from 'react';
import type { Lang } from './i18n';

/** Built-in read-aloud using the device's own voices (works offline on iOS/Android). */
export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  const want = lang === 'hi' ? 'hi' : 'en';
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(want) && /IN/i.test(v.lang)) ?? voices.find((v) => v.lang.toLowerCase().startsWith(want))
  );
}

export function speak(text: string, lang: Lang, onEnd?: () => void) {
  if (!speechSupported()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const v = pickVoice(lang);
  if (v) u.voice = v;
  u.rate = 0.95;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (speechSupported()) speechSynthesis.cancel();
}

export function useSpeaking() {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  return [speaking, setSpeaking] as const;
}

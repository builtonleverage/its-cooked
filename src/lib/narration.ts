import type { Recipe } from './types';
import { formatDuration } from './util';

export type NarrationLang = 'en' | 'hi' | 'hinglish';
export type NarrationMode = 'walkthrough' | 'readall' | 'coach';

export interface AiApp {
  id: string;
  name: string;
  /** Builds a URL that pre-fills the prompt, or null if the app only supports pasting. */
  prefill: ((prompt: string) => string) | null;
  open: string;
  voiceTip: string;
  voiceTipHi: string;
}

/* Prompts are always copied to the clipboard too, so every app works even without pre-fill. */
export const AI_APPS: AiApp[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    prefill: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p)}`,
    open: 'https://chatgpt.com/',
    voiceTip: 'Tap the voice (waveform) button to talk hands-free.',
    voiceTipHi: 'हैंड्स-फ़्री बात करने के लिए वॉइस (वेवफ़ॉर्म) बटन दबाएँ।',
  },
  {
    id: 'claude',
    name: 'Claude',
    prefill: (p) => `https://claude.ai/new?q=${encodeURIComponent(p)}`,
    open: 'https://claude.ai/new',
    voiceTip: 'Tap the voice mode button to hear it and reply by voice.',
    voiceTipHi: 'सुनने और बोलकर जवाब देने के लिए वॉइस मोड बटन दबाएँ।',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    prefill: null,
    open: 'https://gemini.google.com/app',
    voiceTip: 'Paste the prompt, then use Gemini Live to talk hands-free.',
    voiceTipHi: 'प्रॉम्प्ट पेस्ट करें, फिर हैंड्स-फ़्री बात के लिए Gemini Live चालू करें।',
  },
  {
    id: 'copilot',
    name: 'Copilot',
    prefill: null,
    open: 'https://copilot.microsoft.com/',
    voiceTip: 'Paste the prompt, then tap the microphone for voice.',
    voiceTipHi: 'प्रॉम्प्ट पेस्ट करें, फिर आवाज़ के लिए माइक दबाएँ।',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    prefill: (p) => `https://www.perplexity.ai/search?q=${encodeURIComponent(p)}`,
    open: 'https://www.perplexity.ai/',
    voiceTip: 'Use the voice button to listen and ask follow-ups.',
    voiceTipHi: 'सुनने और सवाल पूछने के लिए वॉइस बटन दबाएँ।',
  },
];

/** Long prompts make giant URLs that some apps reject — beyond this we rely on paste only. */
const MAX_URL = 6000;
export function appUrl(app: AiApp, prompt: string): { url: string; prefilled: boolean } {
  if (app.prefill) {
    const url = app.prefill(prompt);
    if (url.length <= MAX_URL) return { url, prefilled: true };
  }
  return { url: app.open, prefilled: false };
}

const LANG_LINE: Record<NarrationLang, string> = {
  en: 'Speak in clear, friendly English.',
  hi: 'Speak only in simple, natural Hindi (देवनागरी), using everyday Indian kitchen words people actually say (atta, ajwain, tawa, etc.). Translate the recipe below as you go.',
  hinglish:
    'Speak in casual Hinglish — Hindi written in Roman script mixed with common English cooking words, the way people talk at home in India.',
};

export function buildPrompt(r: Recipe, opts: { lang: NarrationLang; mode: NarrationMode; fromStep?: number }): string {
  const fromStep = Math.max(0, Math.min(opts.fromStep ?? 0, r.steps.length - 1));
  const lines: string[] = [];

  if (opts.mode === 'walkthrough') {
    lines.push(
      `You are my friendly, patient kitchen guide. I'm cooking "${r.title}" right now with messy hands, so I'm using voice. Guide me hands-free.`,
      LANG_LINE[opts.lang],
      'How to guide me:',
      '- Keep every reply short (under 40 words) and easy to follow by ear. No tables, lists or markdown symbols.',
      fromStep > 0
        ? `- I'm already on step ${fromStep + 1}. Briefly confirm, then continue from there.`
        : '- First tell me what equipment and ingredients to get ready, grouped simply, and ask if I am ready.',
      '- Then give ONE step at a time and wait. Move on only when I say "next" (or "aage"). If I say "repeat", say it again more simply. If I ask a question, answer it, then remind me where we are.',
      '- When a step has a timer, tell me to start it and what to look, smell or listen for so I know it is going right.',
      '- Point out common mistakes just before I might make them.',
      '- Respect the dietary notes (e.g. diabetic-friendly, low-salt). Do not add ingredients or change quantities unless I ask.',
    );
  } else if (opts.mode === 'readall') {
    lines.push(
      `Read this recipe for "${r.title}" aloud to me in a warm, natural way, like a cooking show host.`,
      LANG_LINE[opts.lang],
      'Read the ingredients clearly with quantities, then each step in order, with a short pause line between steps. Mention timers and what doneness looks like. Avoid markdown, tables or symbols — this will be spoken.',
    );
  } else {
    lines.push(
      `Be my cooking coach for "${r.title}".`,
      LANG_LINE[opts.lang],
      'Give me a short spoken overview (what it is, total time, the tricky parts), then useful tips, smart substitutions that keep it diabetic-friendly and low-salt where relevant, and how to plan the timing. Then offer to walk me through it step by step. Keep it conversational — this will be spoken, so no markdown.',
    );
  }

  lines.push('', `RECIPE: ${r.title}`);
  if (r.summary) lines.push(r.summary);
  const time = [r.prepMinutes && `prep ${r.prepMinutes} min`, r.cookMinutes && `cook ${r.cookMinutes} min`].filter(Boolean).join(', ');
  lines.push(`Serves ${r.servings}${time ? ` · ${time}` : ''}`);
  if (r.tags.length) lines.push(`Tags: ${r.tags.join(', ')}`);
  lines.push('', 'INGREDIENTS:');
  for (const i of r.ingredients) lines.push(`- ${[i.quantity, i.unit, i.name].filter(Boolean).join(' ')}${i.note ? ` (${i.note})` : ''}`);
  lines.push('', 'STEPS:');
  r.steps.forEach((s, n) => {
    lines.push(`${n + 1}. ${s.text}`);
    for (const t of s.timers) {
      const checks = t.checks.map((c) => `${formatDuration(c.atSeconds)}: ${c.label}`).join('; ');
      lines.push(`   [Timer: ${t.label}, ${formatDuration(t.seconds)}${checks ? ` — checks at ${checks}` : ''}]`);
    }
  });
  if (r.notes.trim()) lines.push('', 'NOTES:', r.notes.trim());
  return lines.join('\n');
}

/** Copies text, with a fallback for browsers/contexts without the async Clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

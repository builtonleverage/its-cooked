import type { Recipe, RecipeTranslation } from './types';
import type { Lang } from './i18n';

/** Stable hash of every translatable field, so we can tell when a translation is outdated. */
export function contentHash(r: Recipe): string {
  const src = JSON.stringify([
    r.title,
    r.summary,
    r.notes,
    r.tags,
    r.ingredients.map((i) => [i.name, i.unit, i.note ?? '']),
    r.steps.map((s) => [s.text, s.timers.map((t) => [t.label, t.checks.map((c) => c.label)])]),
  ]);
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export type TranslationState = 'none' | 'ok' | 'outdated';
export function translationState(r: Recipe, lang: Lang): TranslationState {
  if (lang === 'en') return 'ok';
  const tr = r.translations?.[lang];
  if (!tr) return 'none';
  return tr.sourceHash === contentHash(r) ? 'ok' : 'outdated';
}

/** Returns the recipe with its text swapped for the given language (falls back to the original per field). */
export function localize(r: Recipe, lang: Lang): Recipe {
  const tr = lang === 'hi' ? r.translations?.hi : undefined;
  if (!tr) return r;
  return {
    ...r,
    title: tr.title || r.title,
    summary: tr.summary || r.summary,
    notes: tr.notes || r.notes,
    tags: tr.tags.length === r.tags.length ? tr.tags : r.tags,
    ingredients: r.ingredients.map((i) => {
      const x = tr.ingredients[i.id];
      return x ? { ...i, name: x.name || i.name, unit: x.unit ?? i.unit, note: x.note ?? i.note } : i;
    }),
    steps: r.steps.map((s) => {
      const x = tr.steps[s.id];
      if (!x) return s;
      return {
        ...s,
        text: x.text || s.text,
        timers: s.timers.map((t) => {
          const y = x.timers[t.id];
          return y ? { ...t, label: y.label || t.label, checks: t.checks.map((c, k) => ({ ...c, label: y.checks[k] || c.label })) } : t;
        }),
      };
    }),
  };
}

/* ---------------- machine translation engines ---------------- */

type Engine = (texts: string[], onProgress: (done: number) => void) => Promise<string[]>;

/** Chrome's on-device Translator API: private, free and works offline once the model is downloaded. */
async function builtInEngine(): Promise<Engine | null> {
  const T = (globalThis as any).Translator;
  if (!T?.create) return null;
  try {
    const avail = await T.availability({ sourceLanguage: 'en', targetLanguage: 'hi' });
    if (avail === 'unavailable') return null;
    const tr = await T.create({ sourceLanguage: 'en', targetLanguage: 'hi' });
    return async (texts, onProgress) => {
      const out: string[] = [];
      for (const t of texts) {
        out.push(await tr.translate(t));
        onProgress(out.length);
      }
      return out;
    };
  } catch {
    return null;
  }
}

/** MyMemory free public API (CORS-enabled, no key). Each request is limited to ~500 bytes. */
function chunk(text: string, max = 450): string[] {
  if (text.length <= max) return [text];
  const parts = text.match(/[^.!?\n]+[.!?]*\s*|\n+/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > max && cur) {
      out.push(cur);
      cur = '';
    }
    cur += p;
  }
  if (cur) out.push(cur);
  return out;
}

const myMemoryEngine: Engine = async (texts, onProgress) => {
  let done = 0;
  const one = async (text: string): Promise<string> => {
    const pieces: string[] = [];
    for (const piece of chunk(text)) {
      if (!piece.trim()) {
        pieces.push(piece);
        continue;
      }
      const url = `https://api.mymemory.translated.net/get?${new URLSearchParams({ q: piece.trim(), langpair: 'en|hi' })}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`translation service error ${res.status}`);
      const data = await res.json();
      const out: string = data?.responseData?.translatedText ?? '';
      if (data?.responseStatus !== 200 || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out))
        throw new Error(data?.responseDetails || 'daily free translation limit reached — try again tomorrow');
      pieces.push(out + (/\s$/.test(piece) ? ' ' : ''));
    }
    onProgress(++done);
    return pieces.join('').trim();
  };
  // Small concurrency keeps it quick without hammering the free service.
  const results: string[] = new Array(texts.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < texts.length) {
        const i = next++;
        results[i] = await one(texts[i]);
      }
    }),
  );
  return results;
};

/** Translates every text field of a recipe to Hindi. Quantities and numbers are left as-is. */
export async function translateRecipe(r: Recipe, onProgress: (pct: number) => void): Promise<RecipeTranslation> {
  const fields: string[] = [];
  const add = (s: string | undefined) => {
    const v = (s ?? '').trim();
    if (!v) return -1;
    const at = fields.indexOf(v);
    if (at >= 0) return at;
    fields.push(v);
    return fields.length - 1;
  };
  const idx = {
    title: add(r.title),
    summary: add(r.summary),
    notes: r.notes.split(/\n{2,}/).map(add),
    tags: r.tags.map(add),
    ingredients: r.ingredients.map((i) => ({ id: i.id, name: add(i.name), unit: add(i.unit), note: add(i.note) })),
    steps: r.steps.map((s) => ({
      id: s.id,
      text: add(s.text),
      timers: s.timers.map((t) => ({ id: t.id, label: add(t.label), checks: t.checks.map((c) => add(c.label)) })),
    })),
  };

  if (!navigator.onLine && !(globalThis as any).Translator) throw new Error('you are offline');
  const engine = (await builtInEngine()) ?? myMemoryEngine;
  const out = await engine(fields, (n) => onProgress(Math.round((n / Math.max(1, fields.length)) * 100)));
  const get = (i: number) => (i >= 0 ? out[i] : '');

  return {
    title: get(idx.title),
    summary: get(idx.summary),
    notes: idx.notes.map(get).join('\n\n'),
    tags: idx.tags.map(get),
    ingredients: Object.fromEntries(idx.ingredients.map((i) => [i.id, { name: get(i.name), unit: get(i.unit), note: get(i.note) || undefined }])),
    steps: Object.fromEntries(
      idx.steps.map((s) => [
        s.id,
        { text: get(s.text), timers: Object.fromEntries(s.timers.map((t) => [t.id, { label: get(t.label), checks: t.checks.map(get) }])) },
      ]),
    ),
    sourceHash: contentHash(r),
    source: 'machine',
    translatedAt: Date.now(),
  };
}

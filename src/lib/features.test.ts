import { describe, expect, it } from 'vitest';
import { seedRecipes } from './seed';
import { contentHash, localize, translationState } from './translate';
import { AI_APPS, appUrl, buildPrompt } from './narration';

const seed = seedRecipes()[0];

describe('Hindi translation', () => {
  it('seed ships with an up-to-date hand-written Hindi translation', () => {
    expect(translationState(seed, 'hi')).toBe('ok');
    const hi = localize(seed, 'hi');
    expect(hi.title).toMatch(/पराठा/);
    expect(hi.steps[6].timers[0].label).toBe('बैच सेंकना');
    expect(hi.steps[6].timers[0].checks.map((c) => c.atSeconds)).toEqual([240, 360]); // timings untouched
    expect(hi.ingredients[0].quantity).toBe('2');
  });
  it('detects outdated translations when the recipe text changes', () => {
    const edited = { ...seed, steps: seed.steps.map((s, i) => (i === 0 ? { ...s, text: s.text + ' Extra.' } : s)) };
    expect(contentHash(edited)).not.toBe(contentHash(seed));
    expect(translationState(edited, 'hi')).toBe('outdated');
    expect(translationState({ ...seed, favourite: true }, 'hi')).toBe('ok');
  });
  it('English view is unchanged', () => {
    expect(localize(seed, 'en')).toBe(seed);
  });
});

describe('AI narration prompt', () => {
  it('includes the recipe, timers and language instructions', () => {
    const p = buildPrompt(seed, { lang: 'hi', mode: 'walkthrough' });
    expect(p).toContain('Hindi');
    expect(p).toContain('Tandoor preheat, 15 min');
    expect(p).toContain('wait');
    expect(buildPrompt(seed, { lang: 'en', mode: 'walkthrough', fromStep: 6 })).toContain('step 7');
  });
  it('pre-fills apps that support it and falls back to paste for long prompts', () => {
    const chatgpt = AI_APPS.find((a) => a.id === 'chatgpt')!;
    const gemini = AI_APPS.find((a) => a.id === 'gemini')!;
    expect(appUrl(chatgpt, 'hello').url).toBe('https://chatgpt.com/?q=hello');
    expect(appUrl(gemini, 'hello').prefilled).toBe(false);
    expect(appUrl(chatgpt, 'x'.repeat(9000))).toEqual({ url: chatgpt.open, prefilled: false });
  });
});

import { useCallback, useEffect, useState } from 'react';
import { getRecipe, saveRecipe } from '../lib/db';
import { navigate } from '../lib/router';
import type { ImageCredit, Ingredient, Recipe, Step, TimerSpec } from '../lib/types';
import { detectTimers, uid } from '../lib/util';
import { Icon } from '../components/Icon';
import { BackBar } from './RecipeView';
import { ImagePicker } from '../components/ImagePicker';
import { CreditedImage } from '../components/Credit';

const blank = (): Recipe => ({
  id: uid(),
  title: '',
  summary: '',
  servings: 2,
  tags: [],
  ingredients: [],
  steps: [{ id: uid(), text: '', timers: [] }],
  notes: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

/* Ingredients are edited as plain lines ("2 cups flour, sifted") — the fastest way to type on a phone. */
const UNITS = 'cups?|tbsp|tsp|teaspoons?|tablespoons?|g|kg|ml|l|litres?|liters?|oz|lb|pinch|cloves?|medium|large|small|handful|bunch|cm|inch(?:es)?|cans?|slices?';
export function parseIngredient(line: string): Ingredient {
  const [main, ...rest] = line.split(',');
  const m = main.trim().match(new RegExp(`^([\\d¼½¾⅓⅔⅛./\\s–-]+)?\\s*(${UNITS})?\\b\\s*(.*)$`, 'i'));
  return {
    id: uid(),
    quantity: (m?.[1] ?? '').trim(),
    unit: (m?.[2] ?? '').trim(),
    name: (m?.[3] ?? main).trim() || main.trim(),
    note: rest.join(',').trim() || undefined,
  };
}
const formatIngredient = (i: Ingredient) => [[i.quantity, i.unit, i.name].filter(Boolean).join(' '), i.note].filter(Boolean).join(', ');

type PickerTarget = { kind: 'hero' } | { kind: 'step'; index: number } | null;

export function RecipeEdit({ id }: { id?: string }) {
  const [r, setR] = useState<Recipe | null>(id ? null : blank());
  const [ingText, setIngText] = useState('');
  const [tagText, setTagText] = useState('');
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [error, setError] = useState('');
  const [stepMsg, setStepMsg] = useState<{ index: number; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    getRecipe(id).then((x) => {
      const rec = x ?? blank();
      setR(rec);
      setIngText(rec.ingredients.map(formatIngredient).join('\n'));
      setTagText(rec.tags.join(', '));
    });
  }, [id]);

  const closePicker = useCallback(() => setPicker(null), []);
  if (!r) return <div className="page" />;

  const set = (patch: Partial<Recipe>) => setR({ ...r, ...patch });
  const setStep = (i: number, patch: Partial<Step>) => set({ steps: r.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const moveStep = (i: number, d: number) => {
    const steps = [...r.steps];
    const [s] = steps.splice(i, 1);
    steps.splice(i + d, 0, s);
    set({ steps });
  };
  const setTimer = (si: number, ti: number, patch: Partial<TimerSpec>) =>
    setStep(si, { timers: r.steps[si].timers.map((t, j) => (j === ti ? { ...t, ...patch } : t)) });

  const save = async () => {
    if (!r.title.trim()) {
      setError('Please give your recipe a name.');
      return;
    }
    const ingredients = ingText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map(parseIngredient);
    const tags = [...new Set(tagText.split(',').map((t) => t.trim()).filter(Boolean))];
    const steps = r.steps.filter((s) => s.text.trim() || s.timers.length);
    await saveRecipe({ ...r, title: r.title.trim(), ingredients, tags, steps });
    navigate(`/recipe/${r.id}`, true);
  };

  const onPick = (c: ImageCredit) => {
    if (picker?.kind === 'hero') set({ image: c });
    else if (picker?.kind === 'step') setStep(picker.index, { image: c });
    setPicker(null);
  };

  return (
    <div className="page editor">
      <BackBar
        title={id ? 'Edit recipe' : 'New recipe'}
        right={
          <button className="btn primary small" onClick={save}>
            Save
          </button>
        }
      />
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}

      <label className="field">
        <span>Name</span>
        <input className="input lg" value={r.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Onion Tandoori Paratha" />
      </label>
      <label className="field">
        <span>Short description</span>
        <textarea className="input" rows={2} value={r.summary} onChange={(e) => set({ summary: e.target.value })} />
      </label>

      <div className="field">
        <span>Photo</span>
        {r.image ? (
          <div>
            <CreditedImage credit={r.image} recipeId={r.id} className="hero small-hero" />
            <div className="row">
              <button className="btn small" onClick={() => setPicker({ kind: 'hero' })}>
                Change
              </button>
              <button className="btn small ghost" onClick={() => set({ image: undefined })}>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button className="btn" onClick={() => setPicker({ kind: 'hero' })}>
            <Icon name="image" /> Find a free image
          </button>
        )}
      </div>

      <div className="grid3">
        <label className="field">
          <span>Servings</span>
          <input className="input" type="number" inputMode="numeric" min={1} value={r.servings} onChange={(e) => set({ servings: Math.max(1, +e.target.value || 1) })} />
        </label>
        <label className="field">
          <span>Prep (min)</span>
          <input className="input" type="number" inputMode="numeric" min={0} value={r.prepMinutes ?? ''} onChange={(e) => set({ prepMinutes: e.target.value ? +e.target.value : undefined })} />
        </label>
        <label className="field">
          <span>Cook (min)</span>
          <input className="input" type="number" inputMode="numeric" min={0} value={r.cookMinutes ?? ''} onChange={(e) => set({ cookMinutes: e.target.value ? +e.target.value : undefined })} />
        </label>
      </div>

      <label className="field">
        <span>Tags (comma separated)</span>
        <input className="input" value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Diabetic-friendly, Low-salt, Indian" />
      </label>

      <label className="field">
        <span>Ingredients — one per line</span>
        <textarea
          className="input mono"
          rows={Math.max(5, ingText.split('\n').length + 1)}
          value={ingText}
          onChange={(e) => setIngText(e.target.value)}
          placeholder={'2 cups whole-wheat flour\n1 tsp salt, or to taste\n2 medium onions, finely chopped'}
        />
      </label>

      <div className="field">
        <span>Steps</span>
        <ol className="edit-steps">
          {r.steps.map((s, i) => (
            <li key={s.id} className="edit-step">
              <div className="edit-step-head">
                <strong>Step {i + 1}</strong>
                <div className="row tight">
                  <button className="icon-btn sm" disabled={i === 0} onClick={() => moveStep(i, -1)} aria-label={`Move step ${i + 1} up`}>
                    <Icon name="up" size={18} />
                  </button>
                  <button className="icon-btn sm" disabled={i === r.steps.length - 1} onClick={() => moveStep(i, 1)} aria-label={`Move step ${i + 1} down`}>
                    <Icon name="down" size={18} />
                  </button>
                  <button className="icon-btn sm" onClick={() => set({ steps: r.steps.filter((_, j) => j !== i) })} aria-label={`Delete step ${i + 1}`}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              </div>
              <textarea className="input" rows={3} value={s.text} onChange={(e) => setStep(i, { text: e.target.value })} placeholder="Describe this step…" aria-label={`Step ${i + 1} instructions`} />

              {s.timers.map((t, ti) => (
                <div key={t.id} className="timer-edit">
                  <input className="input" value={t.label} onChange={(e) => setTimer(i, ti, { label: e.target.value })} aria-label="Timer name" placeholder="Timer name" />
                  <label className="mini">
                    <input
                      className="input"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.5"
                      value={+(t.seconds / 60).toFixed(2)}
                      onChange={(e) => setTimer(i, ti, { seconds: Math.round((+e.target.value || 0) * 60) })}
                      aria-label="Minutes"
                    />
                    min
                  </label>
                  <label className="mini wide">
                    check at
                    <input
                      className="input"
                      defaultValue={t.checks.map((c) => +(c.atSeconds / 60).toFixed(2)).join(', ')}
                      onBlur={(e) =>
                        setTimer(i, ti, {
                          checks: e.target.value
                            .split(/[,\s]+/)
                            .map(Number)
                            .filter((n) => n > 0)
                            .map((n) => ({ atSeconds: Math.round(n * 60), label: t.checks.find((c) => c.atSeconds === Math.round(n * 60))?.label || 'Check' })),
                        })
                      }
                      placeholder="e.g. 4"
                      aria-label="Check-in alerts, minutes (comma separated)"
                    />
                    min
                  </label>
                  <button className="icon-btn sm" onClick={() => setStep(i, { timers: s.timers.filter((_, j) => j !== ti) })} aria-label="Remove timer">
                    <Icon name="close" size={18} />
                  </button>
                </div>
              ))}

              {s.image && (
                <div>
                  <CreditedImage credit={s.image} recipeId={r.id} className="step-img" />
                  <button className="btn small ghost" onClick={() => setStep(i, { image: undefined })}>
                    Remove image
                  </button>
                </div>
              )}

              {stepMsg?.index === i && (
                <p className="small muted" role="status">
                  {stepMsg.text}
                </p>
              )}
              <div className="row wrap">
                <button className="btn small" onClick={() => setStep(i, { timers: [...s.timers, { id: uid(), label: 'Timer', seconds: 300, checks: [] }] })}>
                  <Icon name="timer" size={18} /> Add timer
                </button>
                <button
                  className="btn small"
                  onClick={() => {
                    const found = detectTimers(s.text);
                    if (!found.length) return setStepMsg({ index: i, text: 'No durations found in this step. Write them like “bake 6–8 min”.' });
                    setStepMsg(null);
                    setStep(i, { timers: [...s.timers, ...found.map((f) => ({ ...f, id: uid() }))] });
                  }}
                >
                  <Icon name="wand" size={18} /> Detect timers
                </button>
                {!s.image && (
                  <button className="btn small" onClick={() => setPicker({ kind: 'step', index: i })}>
                    <Icon name="image" size={18} /> Image
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
        <button className="btn block" onClick={() => set({ steps: [...r.steps, { id: uid(), text: '', timers: [] }] })}>
          <Icon name="plus" /> Add step
        </button>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea className="input" rows={5} value={r.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Diabetic-friendly swaps, low-salt tips, equipment notes…" />
      </label>

      <button className="btn primary xl block" onClick={save}>
        <Icon name="check" /> Save recipe
      </button>

      {picker && <ImagePicker initialQuery={r.title || 'food'} onPick={onPick} onClose={closePicker} />}
    </div>
  );
}

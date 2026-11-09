import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecipe, useWakeLock } from '../lib/hooks';
import { navigate } from '../lib/router';
import { useTimers } from '../lib/timers';
import { Icon } from '../components/Icon';
import { CreditedImage } from '../components/Credit';
import { StartTimerButton, TimerCard } from '../components/TimerViews';
import { Sheet } from '../components/Sheet';
import { haptic } from '../lib/util';

const posKey = (id: string) => `its-cooked:cook:${id}`;

export function CookMode({ id }: { id: string }) {
  const recipe = useRecipe(id);
  const { timers } = useTimers();
  const [step, setStep] = useState(() => {
    try {
      return Number(sessionStorage.getItem(posKey(id))) || 0;
    } catch {
      return 0;
    }
  });
  const [showIng, setShowIng] = useState(false);
  const [big, setBig] = useState(false);
  const wake = useWakeLock(true);
  const total = recipe ? recipe.steps.length : 0;
  const finished = step >= total && total > 0;

  const go = useCallback(
    (d: number) => {
      setStep((s) => {
        const n = Math.min(Math.max(0, s + d), total);
        if (n !== s) haptic(8);
        return n;
      });
    },
    [total],
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(posKey(id), String(step));
    } catch {
      /* ignore */
    }
  }, [id, step]);

  // Keyboard / Bluetooth page-turner / foot-pedal friendly.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
        go(1);
      } else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Escape') navigate(`/recipe/${id}`, true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, id]);

  // Swipe left/right (works with a knuckle or the back of a floury hand).
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  if (!recipe) return <div className="cook" />;
  const s = recipe.steps[step];
  const stepTimers = timers.filter((t) => t.recipeId === recipe.id && t.stepIndex === step);
  const otherTimers = timers.filter((t) => !(t.recipeId === recipe.id && t.stepIndex === step) && t.status !== 'done');

  return (
    <div className={`cook ${big ? 'bigger' : ''}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="cook-head">
        <button className="icon-btn" onClick={() => navigate(`/recipe/${id}`, true)} aria-label="Exit Cook Mode">
          <Icon name="close" />
        </button>
        <div className="cook-title">
          <span className="ellipsis">{recipe.title}</span>
          <span className="small muted">
            {finished ? 'Finished' : `Step ${step + 1} of ${total}`}
            {wake === 'on' ? ' · screen stays on' : wake === 'unsupported' ? '' : ''}
          </span>
        </div>
        <button className="icon-btn" onClick={() => setBig((b) => !b)} aria-pressed={big} aria-label="Larger text">
          <span className="aa">Aa</span>
        </button>
        <button className="icon-btn" onClick={() => setShowIng(true)} aria-label="Show ingredients">
          <Icon name="list" />
        </button>
      </header>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(step + 1, total)}>
        <div style={{ width: `${(Math.min(step + 1, total) / Math.max(1, total)) * 100}%` }} />
      </div>

      <section className="cook-body" aria-live="polite">
        {finished ? (
          <div className="cook-done">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={120} height={120} />
            <h1>It's cooked!</h1>
            <p className="lead">Enjoy your {recipe.title}.</p>
            <button className="btn xl" onClick={() => setStep(0)}>
              <Icon name="restart" /> Start over
            </button>
            <button className="btn primary xl" onClick={() => navigate(`/recipe/${id}`, true)}>
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="cook-text">{s.text}</p>
            {s.image && <CreditedImage credit={s.image} recipeId={recipe.id} className="cook-img" />}
            {s.timers.length > 0 && (
              <div className="cook-timers">
                {s.timers.map((t) => (
                  <StartTimerButton key={t.id} spec={t} recipeId={recipe.id} recipeTitle={recipe.title} stepIndex={step} />
                ))}
              </div>
            )}
            {stepTimers.map((t) => (
              <TimerCard key={t.id} t={t} big />
            ))}
          </>
        )}
        {otherTimers.length > 0 && (
          <div className="cook-other">
            <h2 className="small muted">Other running timers</h2>
            {otherTimers.map((t) => (
              <TimerCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>

      {!finished && (
        <footer className="cook-nav">
          <button className="btn xl" onClick={() => go(-1)} disabled={step === 0} aria-label="Previous step">
            <Icon name="back" size={28} />
          </button>
          <button className="btn primary xl grow" onClick={() => go(1)} aria-label={step === total - 1 ? 'Finish' : 'Next step'}>
            {step === total - 1 ? 'Finish' : 'Next'} <Icon name="next" size={28} />
          </button>
        </footer>
      )}

      {showIng && (
        <Sheet title="Ingredients" onClose={() => setShowIng(false)}>
          <ul className="ingredients big">
            {recipe.ingredients.map((i) => (
              <li key={i.id}>
                <strong>
                  {i.quantity} {i.unit}
                </strong>{' '}
                {i.name}
                {i.note && <span className="muted">, {i.note}</span>}
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </div>
  );
}

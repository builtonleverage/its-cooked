import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecipe, useWakeLock } from '../lib/hooks';
import { goBack } from '../lib/router';
import { useTimers } from '../lib/timers';
import { Icon, logoUrl } from '../components/Icon';
import { CreditedImage } from '../components/Credit';
import { StartTimerButton, TimerCard } from '../components/TimerViews';
import { Sheet } from '../components/Sheet';
import { haptic } from '../lib/util';
import { fmtDur, useLang, useT } from '../lib/i18n';
import { localize } from '../lib/translate';
import { LangToggle, TranslateBanner } from '../components/Lang';
import { NarrateSheet } from '../components/NarrateSheet';
import { speak, speechSupported, stopSpeaking, useSpeaking } from '../lib/speech';

const posKey = (id: string) => `its-cooked:cook:${id}`;

export function CookMode({ id }: { id: string }) {
  const raw = useRecipe(id);
  const lang = useLang();
  const t = useT();
  const recipe = raw ? localize(raw, lang) : raw;
  const { timers } = useTimers();
  const [narrate, setNarrate] = useState(false);
  const [speaking, setSpeaking] = useSpeaking();
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

  // Stop reading when the step or language changes.
  useEffect(() => {
    stopSpeaking();
    setSpeaking(false);
  }, [step, lang, setSpeaking]);

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
      const el = e.target as HTMLElement;
      if (el.closest?.('input, textarea, select, button, a, dialog') || document.querySelector('dialog[open]')) return;
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
        go(1);
      } else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Escape') goBack(`/recipe/${id}`);
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

  if (!recipe || !raw) return <div className="cook" />;

  const readStep = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const st = recipe.steps[step];
    if (!st) return;
    const timerText = st.timers.map((x) => `${x.label}, ${fmtDur(x.seconds, lang)}.`).join(' ');
    const prefix = t('stepOf', { n: step + 1, total });
    setSpeaking(true);
    speak(`${prefix}. ${st.text} ${timerText}`, lang, () => setSpeaking(false));
  };
  const s = recipe.steps[step];
  const stepTimers = timers.filter((t) => t.recipeId === recipe.id && t.stepIndex === step);
  const otherTimers = timers.filter((t) => !(t.recipeId === recipe.id && t.stepIndex === step) && t.status !== 'done');

  return (
    <div className={`cook ${big ? 'bigger' : ''}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="cook-head">
        <button className="icon-btn" onClick={() => goBack(`/recipe/${id}`)} aria-label={t('exit')}>
          <Icon name="close" />
        </button>
        <div className="cook-title">
          <span className="ellipsis">{recipe.title}</span>
          <span className="small muted">
            {finished ? t('finished') : t('stepOf', { n: step + 1, total })}
            {wake === 'on' ? (lang === 'hi' ? ' · स्क्रीन चालू रहेगी' : ' · screen stays on') : ''}
          </span>
        </div>
        <LangToggle />
        <button className="icon-btn" onClick={() => setBig((b) => !b)} aria-pressed={big} aria-label="Larger text">
          <span className="aa">Aa</span>
        </button>
        <button className="icon-btn" onClick={() => setShowIng(true)} aria-label={t('ingredientsShow')}>
          <Icon name="list" />
        </button>
      </header>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(step + 1, total)}>
        <div style={{ width: `${(Math.min(step + 1, total) / Math.max(1, total)) * 100}%` }} />
      </div>

      <section className="cook-body" aria-live="polite">
        {finished ? (
          <div className="cook-done">
            <img src={logoUrl} alt="" width={120} height={120} />
            <h1>{t('itsCooked')}</h1>
            <p className="lead">{t('enjoy', { title: recipe.title })}</p>
            <button className="btn xl" onClick={() => setStep(0)}>
              <Icon name="restart" /> {t('startOver')}
            </button>
            <button className="btn primary xl" onClick={() => goBack(`/recipe/${id}`)}>
              {t('done')}
            </button>
          </div>
        ) : (
          <>
            <TranslateBanner recipe={raw} compact />
            <p className="cook-text">{s.text}</p>
            <div className="cook-tools">
              {speechSupported() && (
                <button className={`btn small ${speaking ? 'primary' : ''}`} onClick={readStep} aria-pressed={speaking}>
                  <Icon name="speaker" size={18} /> {speaking ? t('stopReading') : t('readAloud')}
                </button>
              )}
              <button className="btn small ai" onClick={() => setNarrate(true)}>
                <Icon name="mic" size={18} /> {t('narrate')}
              </button>
            </div>
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
            <h2 className="small muted">{t('otherTimers')}</h2>
            {otherTimers.map((t) => (
              <TimerCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>

      {!finished && (
        <footer className="cook-nav">
          <button className="btn xl" onClick={() => go(-1)} disabled={step === 0} aria-label={t('back')}>
            <Icon name="back" size={28} />
          </button>
          <button className="btn primary xl grow" onClick={() => go(1)}>
            {step === total - 1 ? t('finish') : t('next')} <Icon name="next" size={28} />
          </button>
        </footer>
      )}

      {showIng && (
        <Sheet title={t('ingredients')} onClose={() => setShowIng(false)}>
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
      {narrate && <NarrateSheet recipe={raw} fromStep={finished ? 0 : step} onClose={() => setNarrate(false)} />}
    </div>
  );
}

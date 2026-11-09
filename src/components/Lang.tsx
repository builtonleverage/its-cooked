import { useEffect, useState } from 'react';
import { setLang, useLang, useT } from '../lib/i18n';
import { translateRecipe, translationState } from '../lib/translate';
import { saveRecipe } from '../lib/db';
import type { Recipe } from '../lib/types';
import { useOnline } from '../lib/hooks';

/** One-tap English ⇄ Hindi switch. Shows the language you'll switch TO. */
export function LangToggle({ className = '' }: { className?: string }) {
  const lang = useLang();
  return (
    <button
      className={`lang-toggle ${className}`}
      onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
      aria-label={lang === 'hi' ? 'Switch to English' : 'हिंदी में देखें (Switch to Hindi)'}
      title={lang === 'hi' ? 'English' : 'हिंदी'}
    >
      <span lang={lang === 'hi' ? 'en' : 'hi'}>{lang === 'hi' ? 'EN' : 'हिं'}</span>
    </button>
  );
}

/** Shown in Hindi mode when a recipe has no (or an outdated) Hindi translation. */
export function TranslateBanner({ recipe, compact = false }: { recipe: Recipe; compact?: boolean }) {
  const lang = useLang();
  const t = useT();
  const online = useOnline();
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const state = translationState(recipe, lang);
  useEffect(() => setErr(''), [lang]);
  if (lang === 'en' || state === 'ok') {
    if (lang === 'hi' && recipe.translations?.hi?.source === 'machine' && !compact)
      return <p className="small muted tr-note">{t('machineNote')}</p>;
    return null;
  }

  const run = async () => {
    setErr('');
    setPct(0);
    try {
      const hi = await translateRecipe(recipe, setPct);
      await saveRecipe({ ...recipe, translations: { ...recipe.translations, hi } });
    } catch (e: any) {
      setErr(t('translateFailed', { e: e?.message || 'error' }));
    } finally {
      setPct(null);
    }
  };

  return (
    <div className={`translate-banner ${compact ? 'compact' : ''}`} role="status">
      <span>{state === 'outdated' ? t('translateOutdated') : t('translateCta')}</span>
      <button className="btn small primary" onClick={run} disabled={pct !== null || !online}>
        {pct !== null ? t('translating', { p: pct }) : state === 'outdated' ? t('retranslate') : t('translateBtn')}
      </button>
      {!online && <span className="small">{lang === 'hi' ? 'अनुवाद के लिए इंटरनेट चाहिए।' : 'Translation needs a connection.'}</span>}
      {err && <span className="small err">{err}</span>}
    </div>
  );
}

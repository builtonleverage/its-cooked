import { useState } from 'react';
import { useOnline, useRecipe } from '../lib/hooks';
import { deleteRecipe, makeOffline, removeOffline, saveRecipe } from '../lib/db';
import { goBack, navigate } from '../lib/router';
import { ConfirmButton } from '../components/ConfirmButton';
import { Icon } from '../components/Icon';
import { CreditedImage, CreditLine } from '../components/Credit';
import { StartTimerButton } from '../components/TimerViews';
import type { ImageCredit, Recipe } from '../lib/types';
import { useT, useLang } from '../lib/i18n';
import { localize } from '../lib/translate';
import { LangToggle, TranslateBanner } from '../components/Lang';
import { NarrateSheet } from '../components/NarrateSheet';

export function BackBar({ title, to = '/', right }: { title?: string; to?: string; right?: React.ReactNode }) {
  const t = useT();
  return (
    <div className="backbar">
      <button
        className="icon-btn"
        onClick={() => goBack(to)}
        aria-label={t('back')}
      >
        <Icon name="back" />
      </button>
      {title && <span className="backbar-title ellipsis">{title}</span>}
      <div className="row tight">{right}</div>
    </div>
  );
}

export function OfflineButton({ recipe }: { recipe: Recipe }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const online = useOnline();
  const t = useT();
  if (recipe.offlineAt)
    return (
      <ConfirmButton
        className="btn ok"
        onConfirm={() => removeOffline(recipe.id)}
        confirmLabel={t('removeOfflineConfirm')}
        ariaLabel="Saved for offline. Tap twice to remove the offline copy"
      >
        <Icon name="check" /> {t('savedOffline')}
      </ConfirmButton>
    );
  return (
    <>
      <button
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg('');
          const r = await makeOffline(recipe);
          setBusy(false);
          if (r.failed) setMsg(`${r.failed} image${r.failed > 1 ? 's' : ''} couldn't be saved${online ? '' : ' (offline)'} — text is saved.`);
        }}
      >
        <Icon name="download" /> {busy ? t('saving') : t('downloadOffline')}
      </button>
      {msg && <p className="small muted">{msg}</p>}
    </>
  );
}

export function RecipeView({ id }: { id: string }) {
  const raw = useRecipe(id);
  const lang = useLang();
  const t = useT();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [narrate, setNarrate] = useState(false);
  const recipe = raw ? localize(raw, lang) : raw;

  if (recipe === undefined) return <div className="page" />;
  if (recipe === null || !raw)
    return (
      <div className="page">
        <BackBar />
        <div className="empty">Recipe not found.</div>
      </div>
    );

  const credits: ImageCredit[] = [recipe.image, ...recipe.steps.map((s) => s.image)].filter(Boolean) as ImageCredit[];
  const toggle = (iid: string) =>
    setChecked((s) => {
      const n = new Set(s);
      n.has(iid) ? n.delete(iid) : n.add(iid);
      return n;
    });

  return (
    <div className="page recipe">
      <BackBar
        right={
          <>
            <LangToggle />
            <button
              className="icon-btn"
              aria-pressed={!!recipe.favourite}
              aria-label={recipe.favourite ? 'Remove from favourites' : 'Add to favourites'}
              onClick={() => saveRecipe({ ...raw, favourite: !raw.favourite })}
            >
              <Icon name="heart" filled={recipe.favourite} />
            </button>
            <a className="icon-btn" href={`#/edit/${recipe.id}`} aria-label={t('edit')}>
              <Icon name="edit" />
            </a>
          </>
        }
      />
      {recipe.image && <CreditedImage credit={recipe.image} recipeId={recipe.id} className="hero" alt={recipe.title} />}
      <h1 className="recipe-title">{recipe.title}</h1>
      {recipe.summary && <p className="lead">{recipe.summary}</p>}
      <TranslateBanner recipe={raw} />
      <div className="stats">
        <div>
          <strong>{recipe.servings}</strong>
          <span>{t('servings')}</span>
        </div>
        {recipe.prepMinutes ? (
          <div>
            <strong>{recipe.prepMinutes}m</strong>
            <span>{t('prep')}</span>
          </div>
        ) : null}
        {recipe.cookMinutes ? (
          <div>
            <strong>{recipe.cookMinutes}m</strong>
            <span>{t('cook')}</span>
          </div>
        ) : null}
        <div>
          <strong>{recipe.steps.length}</strong>
          <span>{t('steps')}</span>
        </div>
      </div>
      {recipe.tags.length > 0 && (
        <div className="chips wrap">
          {recipe.tags.map((t) => (
            <span key={t} className="chip static">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="action-row">
        <a className="btn primary xl" href={`#/cook/${recipe.id}`}>
          <Icon name="play" /> {t('startCook')}
        </a>
        <button className="btn ai" onClick={() => setNarrate(true)}>
          <Icon name="mic" /> {t('narrate')}
        </button>
        <OfflineButton recipe={raw} />
      </div>

      <section>
        <h2>{t('ingredients')}</h2>
        <ul className="ingredients">
          {recipe.ingredients.map((i) => (
            <li key={i.id}>
              <label className={checked.has(i.id) ? 'done' : ''}>
                <input type="checkbox" checked={checked.has(i.id)} onChange={() => toggle(i.id)} />
                <span>
                  <strong>
                    {i.quantity} {i.unit}
                  </strong>{' '}
                  {i.name}
                  {i.note && <span className="muted">, {i.note}</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t('method')}</h2>
        <ol className="steps">
          {recipe.steps.map((s, idx) => (
            <li key={s.id}>
              <span className="step-num" aria-hidden>
                {idx + 1}
              </span>
              <div className="step-body">
                <p>{s.text}</p>
                {s.image && <CreditedImage credit={s.image} recipeId={recipe.id} className="step-img" />}
                {s.timers.map((t) => (
                  <StartTimerButton key={t.id} spec={t} recipeId={recipe.id} recipeTitle={recipe.title} stepIndex={idx} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {recipe.notes && (
        <section>
          <h2>{t('notes')}</h2>
          <div className="notes">
            {recipe.notes.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {credits.length > 0 && (
        <section className="credits">
          <h2>{t('imageCredits')}</h2>
          <ul>
            {credits.map((c, i) => (
              <li key={i} className="small">
                <CreditLine credit={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmButton
        className="btn danger ghost"
        onConfirm={async () => {
          await deleteRecipe(recipe.id);
          navigate('/', true);
        }}
        confirmLabel={t('deleteConfirm')}
      >
        <Icon name="trash" /> {t('deleteRecipe')}
      </ConfirmButton>
      {narrate && <NarrateSheet recipe={raw} onClose={() => setNarrate(false)} />}
    </div>
  );
}

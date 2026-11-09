import { useState } from 'react';
import { useOnline, useRecipe } from '../lib/hooks';
import { deleteRecipe, makeOffline, removeOffline, saveRecipe } from '../lib/db';
import { navigate } from '../lib/router';
import { Icon } from '../components/Icon';
import { CreditedImage, CreditLine } from '../components/Credit';
import { StartTimerButton } from '../components/TimerViews';
import type { ImageCredit, Recipe } from '../lib/types';

export function BackBar({ title, to = '/', right }: { title?: string; to?: string; right?: React.ReactNode }) {
  return (
    <div className="backbar">
      <button
        className="icon-btn"
        onClick={() => (history.length > 1 ? history.back() : navigate(to))}
        aria-label="Back"
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
  if (recipe.offlineAt)
    return (
      <button
        className="btn ok"
        onClick={async () => {
          if (confirm('Remove the offline copy of this recipe’s images? The recipe itself stays on this device.')) await removeOffline(recipe.id);
        }}
        aria-label="Saved for offline. Tap to remove offline copy"
      >
        <Icon name="check" /> Saved offline
      </button>
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
        <Icon name="download" /> {busy ? 'Saving…' : 'Download for offline'}
      </button>
      {msg && <p className="small muted">{msg}</p>}
    </>
  );
}

export function RecipeView({ id }: { id: string }) {
  const recipe = useRecipe(id);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (recipe === undefined) return <div className="page" />;
  if (recipe === null)
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
            <button
              className="icon-btn"
              aria-pressed={!!recipe.favourite}
              aria-label={recipe.favourite ? 'Remove from favourites' : 'Add to favourites'}
              onClick={() => saveRecipe({ ...recipe, favourite: !recipe.favourite })}
            >
              <Icon name="heart" filled={recipe.favourite} />
            </button>
            <a className="icon-btn" href={`#/edit/${recipe.id}`} aria-label="Edit recipe">
              <Icon name="edit" />
            </a>
          </>
        }
      />
      {recipe.image && <CreditedImage credit={recipe.image} recipeId={recipe.id} className="hero" alt={recipe.title} />}
      <h1 className="recipe-title">{recipe.title}</h1>
      {recipe.summary && <p className="lead">{recipe.summary}</p>}
      <div className="stats">
        <div>
          <strong>{recipe.servings}</strong>
          <span>servings</span>
        </div>
        {recipe.prepMinutes ? (
          <div>
            <strong>{recipe.prepMinutes}m</strong>
            <span>prep</span>
          </div>
        ) : null}
        {recipe.cookMinutes ? (
          <div>
            <strong>{recipe.cookMinutes}m</strong>
            <span>cook</span>
          </div>
        ) : null}
        <div>
          <strong>{recipe.steps.length}</strong>
          <span>steps</span>
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
          <Icon name="play" /> Start Cook Mode
        </a>
        <OfflineButton recipe={recipe} />
      </div>

      <section>
        <h2>Ingredients</h2>
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
        <h2>Method</h2>
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
          <h2>Notes</h2>
          <div className="notes">
            {recipe.notes.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {credits.length > 0 && (
        <section className="credits">
          <h2>Image credits</h2>
          <ul>
            {credits.map((c, i) => (
              <li key={i} className="small">
                <CreditLine credit={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        className="btn danger ghost"
        onClick={async () => {
          if (confirm(`Delete “${recipe.title}”? This can't be undone.`)) {
            await deleteRecipe(recipe.id);
            navigate('/', true);
          }
        }}
      >
        <Icon name="trash" /> Delete recipe
      </button>
    </div>
  );
}

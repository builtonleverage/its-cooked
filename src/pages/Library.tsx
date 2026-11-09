import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRecipes } from '../lib/hooks';
import type { Recipe } from '../lib/types';
import { Icon, Logo } from '../components/Icon';
import { CreditedImage } from '../components/Credit';
import { LangToggle } from '../components/Lang';
import { useLang, useT } from '../lib/i18n';
import { localize } from '../lib/translate';

function searchText(r: Recipe) {
  return [r.title, r.summary, r.notes, ...r.tags, ...r.ingredients.map((i) => i.name)].join(' ').toLowerCase();
}

export function Library() {
  const raw = useRecipes();
  const lang = useLang();
  const t = useT();
  const recipes = useMemo(() => raw?.map((r) => localize(r, lang)) ?? null, [raw, lang]);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const dq = useDeferredValue(q.trim().toLowerCase());
  useEffect(() => setTag(null), [lang]);

  const tags = useMemo(() => {
    const count = new Map<string, number>();
    recipes?.forEach((r) => r.tags.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  }, [recipes]);

  const filtered = useMemo(() => {
    if (!recipes || !raw) return [];
    const words = dq.split(/\s+/).filter(Boolean);
    return recipes.filter((r, idx) => {
      if (tag && !r.tags.includes(tag)) return false;
      if (!words.length) return true;
      // Search both the shown language and the original, so English words work in Hindi mode too.
      const text = searchText(r) + (r === raw[idx] ? '' : ' ' + searchText(raw[idx]));
      return words.every((w) => text.includes(w));
    });
  }, [recipes, raw, dq, tag]);

  return (
    <div className="page">
      <header className="brand-head">
        <Logo size={40} />
        <div>
          <h1>It's Cooked</h1>
          <p className="muted small">{recipes ? (recipes.length === 1 ? t('recipeCount1') : t('recipeCount', { n: recipes.length })) : ' '}</p>
        </div>
        <LangToggle />
        <a className="btn primary round" href="#/new" aria-label={t('newRecipe')}>
          <Icon name="plus" />
        </a>
      </header>

      <div className="search">
        <Icon name="search" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          enterKeyHint="search"
        />
      </div>

      {tags.length > 0 && (
        <div className="chips scroll-x" role="group" aria-label="Filter by tag">
          <button className={`chip ${!tag ? 'on' : ''}`} onClick={() => setTag(null)} aria-pressed={!tag}>
            {t('all')}
          </button>
          {tags.map((t) => (
            <button key={t} className={`chip ${tag === t ? 'on' : ''}`} onClick={() => setTag(tag === t ? null : t)} aria-pressed={tag === t}>
              {t}
            </button>
          ))}
        </div>
      )}

      {recipes && filtered.length === 0 && (
        <div className="empty">
          <Icon name="pot" size={48} />
          <p>{recipes.length ? t('noMatch') : t('noRecipes')}</p>
          {!recipes.length && (
            <a className="btn primary" href="#/new">
              <Icon name="plus" /> {t('newRecipe')}
            </a>
          )}
        </div>
      )}

      <ul className="cards">
        {filtered.map((r) => (
          <li key={r.id}>
            <a className="card" href={`#/recipe/${r.id}`}>
              {r.image ? (
                <CreditedImage credit={r.image} recipeId={r.id} className="card-img" showCredit={false} alt="" />
              ) : (
                <div className="card-img ph">
                  <Icon name="pot" size={36} />
                </div>
              )}
              <div className="card-body">
                <h2>
                  {r.favourite && <Icon name="heart" size={16} filled label="Favourite" />} {r.title}
                </h2>
                <p className="muted small clamp2">{r.summary}</p>
                <div className="meta-row small">
                  {(r.prepMinutes || r.cookMinutes) && <span>⏱ {(r.prepMinutes ?? 0) + (r.cookMinutes ?? 0)} {t('min')}</span>}
                  <span>🍽 {r.servings}</span>
                  {r.offlineAt && (
                    <span className="pill ok">
                      <Icon name="check" size={12} /> {t('offline')}
                    </span>
                  )}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

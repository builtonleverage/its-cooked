import { getMeta, getRecipe, saveRecipe, setMeta } from './db';
import { seedRecipes } from './seed';
import { contentHash } from './translate';

/** Adds the seed recipe on first launch only (deleting it later is respected). */
export async function ensureSeed(force = false) {
  const seeds = seedRecipes();
  if (!force && (await getMeta('seeded'))) {
    // Existing installs: attach the hand-written Hindi to an unedited seed recipe.
    for (const s of seeds) {
      const cur = await getRecipe(s.id);
      if (cur && !cur.translations?.hi && s.translations && contentHash(cur) === contentHash(s))
        await saveRecipe({ ...cur, translations: s.translations });
    }
    return;
  }
  for (const r of seeds) {
    if (force || !(await getRecipe(r.id))) await saveRecipe(r);
  }
  await setMeta('seeded', true);
}

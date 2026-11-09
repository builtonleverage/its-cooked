import { getMeta, getRecipe, saveRecipe, setMeta } from './db';
import { seedRecipes } from './seed';

/** Adds the seed recipe on first launch only (deleting it later is respected). */
export async function ensureSeed(force = false) {
  if (!force && (await getMeta('seeded'))) return;
  for (const r of seedRecipes()) {
    if (force || !(await getRecipe(r.id))) await saveRecipe(r);
  }
  await setMeta('seeded', true);
}

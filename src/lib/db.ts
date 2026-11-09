import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Recipe } from './types';

interface StoredImage {
  key: string; // `${recipeId}|${url}`
  recipeId: string;
  url: string;
  blob: Blob;
  size: number;
  savedAt: number;
}

interface CookedDB extends DBSchema {
  recipes: { key: string; value: Recipe; indexes: { updatedAt: number } };
  images: { key: string; value: StoredImage; indexes: { recipeId: string } };
  meta: { key: string; value: unknown };
}

let dbp: Promise<IDBPDatabase<CookedDB>> | null = null;
export function db() {
  dbp ??= openDB<CookedDB>('its-cooked', 1, {
    upgrade(d) {
      const r = d.createObjectStore('recipes', { keyPath: 'id' });
      r.createIndex('updatedAt', 'updatedAt');
      const i = d.createObjectStore('images', { keyPath: 'key' });
      i.createIndex('recipeId', 'recipeId');
      d.createObjectStore('meta');
    },
  });
  return dbp;
}

/* ---------- change notifications (cheap pub/sub so views refresh) ---------- */
const listeners = new Set<() => void>();
export const onDataChange = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
const emit = () => listeners.forEach((f) => f());

/* ---------- recipes ---------- */
export async function listRecipes(): Promise<Recipe[]> {
  const all = await (await db()).getAll('recipes');
  return all.sort((a, b) => Number(!!b.favourite) - Number(!!a.favourite) || b.updatedAt - a.updatedAt);
}
export async function getRecipe(id: string) {
  return (await db()).get('recipes', id);
}
export async function saveRecipe(r: Recipe) {
  await (await db()).put('recipes', { ...r, updatedAt: Date.now() });
  emit();
  // Keep the offline copy fresh if the recipe was downloaded.
  if (r.offlineAt) void downloadRecipeImages(r).catch(() => {});
}
export async function deleteRecipe(id: string) {
  await removeOffline(id, false);
  await (await db()).delete('recipes', id);
  emit();
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await (await db()).get('meta', key)) as T | undefined;
}
export async function setMeta(key: string, value: unknown) {
  await (await db()).put('meta', value, key);
}

/* ---------- offline images ---------- */
export function recipeImageUrls(r: Recipe): string[] {
  const urls = [r.image?.url, ...r.steps.map((s) => s.image?.url)].filter(Boolean) as string[];
  // Bundled assets are part of the app shell and already precached by the service worker.
  return [...new Set(urls)].filter((u) => /^https?:/.test(u));
}

export async function downloadRecipeImages(r: Recipe): Promise<{ ok: number; failed: number }> {
  const d = await db();
  let ok = 0;
  let failed = 0;
  const wanted = new Set(recipeImageUrls(r));
  for (const url of wanted) {
    const key = `${r.id}|${url}`;
    if (await d.get('images', key)) {
      ok++;
      continue;
    }
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      await d.put('images', { key, recipeId: r.id, url, blob, size: blob.size, savedAt: Date.now() });
      ok++;
    } catch {
      failed++;
    }
  }
  // Drop images no longer used by the recipe.
  for (const img of await d.getAllFromIndex('images', 'recipeId', r.id)) {
    if (!wanted.has(img.url)) await d.delete('images', img.key);
  }
  return { ok, failed };
}

export async function makeOffline(r: Recipe) {
  const result = await downloadRecipeImages(r);
  const updated = { ...r, offlineAt: Date.now() };
  await (await db()).put('recipes', updated);
  emit();
  return result;
}

export async function removeOffline(id: string, keepFlag = true) {
  const d = await db();
  const tx = d.transaction(['images', 'recipes'], 'readwrite');
  for (const key of await tx.objectStore('images').index('recipeId').getAllKeys(id)) {
    await tx.objectStore('images').delete(key);
  }
  if (keepFlag) {
    const r = await tx.objectStore('recipes').get(id);
    if (r) await tx.objectStore('recipes').put({ ...r, offlineAt: undefined });
  }
  await tx.done;
  objectUrlCache.forEach((v, k) => {
    if (k.startsWith(`${id}|`)) {
      URL.revokeObjectURL(v);
      objectUrlCache.delete(k);
    }
  });
  emit();
}

export async function offlineSizes(): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  for (const img of await (await db()).getAll('images')) {
    sizes.set(img.recipeId, (sizes.get(img.recipeId) ?? 0) + img.size);
  }
  return sizes;
}

const objectUrlCache = new Map<string, string>();
/** Returns a blob: URL for an image saved offline, or null if it isn't stored. */
export async function offlineImageUrl(recipeId: string, url: string): Promise<string | null> {
  const key = `${recipeId}|${url}`;
  const hit = objectUrlCache.get(key);
  if (hit) return hit;
  const img = await (await db()).get('images', key);
  if (!img) return null;
  const obj = URL.createObjectURL(img.blob);
  objectUrlCache.set(key, obj);
  return obj;
}

/* ---------- backup ---------- */
export async function exportAll(): Promise<string> {
  return JSON.stringify({ app: 'its-cooked', version: 1, recipes: await listRecipes() }, null, 2);
}
export async function importAll(json: string): Promise<number> {
  const data = JSON.parse(json);
  const recipes: Recipe[] = Array.isArray(data) ? data : data.recipes;
  if (!Array.isArray(recipes)) throw new Error('No recipes found in file');
  const d = await db();
  for (const r of recipes) {
    if (!r?.id || !r.title) continue;
    await d.put('recipes', { ...r, offlineAt: undefined });
  }
  emit();
  return recipes.length;
}

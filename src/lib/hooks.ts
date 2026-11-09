import { useEffect, useState, useSyncExternalStore } from 'react';
import { getRecipe, listRecipes, offlineImageUrl, onDataChange } from './db';
import type { Recipe } from './types';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => listRecipes().then((r) => live && setRecipes(r));
    load();
    const off = onDataChange(load);
    return () => {
      live = false;
      off();
    };
  }, []);
  return recipes;
}

export function useRecipe(id: string | undefined) {
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  useEffect(() => {
    if (!id) return setRecipe(null);
    let live = true;
    const load = () => getRecipe(id).then((r) => live && setRecipe(r ?? null));
    load();
    const off = onDataChange(load);
    return () => {
      live = false;
      off();
    };
  }, [id]);
  return recipe;
}

const onlineSub = (fn: () => void) => {
  window.addEventListener('online', fn);
  window.addEventListener('offline', fn);
  return () => {
    window.removeEventListener('online', fn);
    window.removeEventListener('offline', fn);
  };
};
export const useOnline = () => useSyncExternalStore(onlineSub, () => navigator.onLine);

/** Prefer the copy saved on-device; fall back to the network URL. */
export function useImageSrc(recipeId: string | undefined, url: string | undefined) {
  const [src, setSrc] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!url) return setSrc(undefined);
    if (!recipeId || !/^https?:/.test(url)) return setSrc(url);
    let live = true;
    offlineImageUrl(recipeId, url).then((local) => live && setSrc(local ?? url));
    const off = onDataChange(() => offlineImageUrl(recipeId, url).then((local) => live && setSrc(local ?? url)));
    return () => {
      live = false;
      off();
    };
  }, [recipeId, url]);
  return src;
}

/** Keeps the screen on while `active` (Cook Mode). Re-acquires after app switches. */
export function useWakeLock(active: boolean) {
  const [state, setState] = useState<'on' | 'off' | 'unsupported'>('off');
  useEffect(() => {
    if (!active) return;
    if (!('wakeLock' in navigator)) {
      setState('unsupported');
      return;
    }
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState !== 'visible' || cancelled) return;
        lock = await navigator.wakeLock.request('screen');
        setState('on');
        lock.addEventListener('release', () => !cancelled && setState('off'));
      } catch {
        setState('off');
      }
    };
    void acquire();
    const onVis = () => document.visibilityState === 'visible' && void acquire();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      void lock?.release().catch(() => {});
      setState('off');
    };
  }, [active]);
  return state;
}

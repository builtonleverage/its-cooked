import { useSyncExternalStore } from 'react';

/**
 * Tiny router. Normal builds use the URL hash (works on any static host).
 * The embedded single-file build (__ARTIFACT__) keeps routes in memory, because
 * its host frame doesn't allow path-style hashes.
 */
const MEMORY = typeof __ARTIFACT__ !== 'undefined' && __ARTIFACT__;
const memStack: string[] = ['/'];
const memSubs = new Set<() => void>();
const memEmit = () => memSubs.forEach((f) => f());

const sub = (fn: () => void) => {
  if (MEMORY) {
    memSubs.add(fn);
    return () => void memSubs.delete(fn);
  }
  window.addEventListener('hashchange', fn);
  return () => window.removeEventListener('hashchange', fn);
};
const get = () => (MEMORY ? memStack[memStack.length - 1] : window.location.hash.replace(/^#/, '') || '/');

export function useRoute() {
  return useSyncExternalStore(sub, get);
}

export function navigate(path: string, replace = false) {
  if (MEMORY) {
    if (replace) memStack[memStack.length - 1] = path;
    else memStack.push(path);
    return memEmit();
  }
  const hash = `#${path}`;
  if (replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else window.location.hash = path;
}

/** Go back, or to `fallback` when there's nothing to go back to. */
export function goBack(fallback = '/') {
  if (MEMORY) {
    if (memStack.length > 1) memStack.pop();
    else memStack[0] = fallback;
    return memEmit();
  }
  if (history.length > 1) history.back();
  else navigate(fallback);
}

// In memory mode, ordinary <a href="#/..."> links still work: intercept them.
if (MEMORY && typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest?.('a[href^="#/"]') as HTMLAnchorElement | null;
    if (!a || e.defaultPrevented) return;
    e.preventDefault();
    navigate(a.getAttribute('href')!.slice(1));
  });
}

export function match(route: string, pattern: string): Record<string, string> | null {
  const [path] = route.split('?');
  const a = path.split('/').filter(Boolean);
  const b = pattern.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < b.length; i++) {
    if (b[i].startsWith(':')) params[b[i].slice(1)] = decodeURIComponent(a[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

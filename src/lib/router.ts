import { useSyncExternalStore } from 'react';

/** Tiny hash router: works on GitHub Pages / any static host with zero config. */
const sub = (fn: () => void) => {
  window.addEventListener('hashchange', fn);
  return () => window.removeEventListener('hashchange', fn);
};
const get = () => window.location.hash.replace(/^#/, '') || '/';

export function useRoute() {
  return useSyncExternalStore(sub, get);
}

export function navigate(path: string, replace = false) {
  const hash = `#${path}`;
  if (replace) history.replaceState(null, '', hash);
  else window.location.hash = path;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
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

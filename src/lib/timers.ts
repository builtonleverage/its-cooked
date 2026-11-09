import { useSyncExternalStore } from 'react';
import type { ActiveTimer, TimerSpec } from './types';
import { advance, addTime, createTimer, pause, restart, resume, type TimerEvent } from './timerLogic';
import { notify, playChime, vibrate } from './alerts';
import { formatDuration, uid } from './util';

const KEY = 'its-cooked:timers';

function load(): ActiveTimer[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

let timers: ActiveTimer[] = load();
/** Timer ids that are ringing (done, alert not yet acknowledged). */
let ringing: string[] = [];
type CheckAlert = { timerId: string; label: string; at: number } | null;
let lastCheck: CheckAlert = null;
const subs = new Set<() => void>();
let snapshot: { timers: ActiveTimer[]; ringing: string[]; lastCheck: CheckAlert } = { timers, ringing, lastCheck };

function commit(next: ActiveTimer[], persist = true) {
  timers = next;
  snapshot = { timers, ringing, lastCheck };
  if (persist) {
    try {
      localStorage.setItem(KEY, JSON.stringify(timers));
    } catch {
      /* quota */
    }
  }
  subs.forEach((f) => f());
  schedule();
  updateBadge();
}

function updateBadge() {
  const n = timers.filter((t) => t.status === 'running').length;
  try {
    if (n) (navigator as any).setAppBadge?.(n);
    else (navigator as any).clearAppBadge?.();
  } catch {
    /* unsupported */
  }
}

let ringLoop: number | undefined;
function startRinging() {
  if (ringLoop) return;
  let count = 0;
  ringLoop = window.setInterval(() => {
    if (!ringing.length || ++count > 20) return stopRinging();
    playChime('done');
    vibrate('done');
  }, 3000);
}
function stopRinging() {
  clearInterval(ringLoop);
  ringLoop = undefined;
}

function handle(events: TimerEvent[]) {
  for (const e of events) {
    const where = e.timer.recipeTitle ? ` · ${e.timer.recipeTitle}` : '';
    const late = e.lateMs > 60_000 ? ` (${formatDuration(Math.round(e.lateMs / 1000))} ago)` : '';
    if (e.kind === 'done') {
      ringing = [...new Set([...ringing, e.timer.id])];
      playChime('done');
      vibrate('done');
      void notify(`⏰ ${e.timer.label} is done`, `Time's up${late}${where}`, `timer-${e.timer.id}`);
      if (e.lateMs < 60_000) startRinging();
    } else {
      lastCheck = { timerId: e.timer.id, label: `${e.timer.label}: ${e.label}`, at: Date.now() };
      playChime('check');
      vibrate('check');
      void notify(`👀 ${e.timer.label}`, `${e.label}${late}${where}`, `check-${e.timer.id}`);
    }
  }
}

function tick() {
  const r = advance(timers, Date.now());
  if (r.events.length) handle(r.events);
  if (r.changed) commit(r.timers);
  else {
    snapshot = { ...snapshot }; // new identity so countdowns re-render
    subs.forEach((f) => f());
  }
}

let interval: number | undefined;
function schedule() {
  const anyRunning = timers.some((t) => t.status === 'running');
  if (anyRunning && !interval) interval = window.setInterval(tick, 250);
  if (!anyRunning && interval) {
    clearInterval(interval);
    interval = undefined;
  }
}

if (typeof window !== 'undefined') {
  // Catch up immediately on load and whenever the app comes back to the foreground.
  queueMicrotask(tick);
  schedule();
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());
  window.addEventListener('pageshow', tick);
  // Keep multiple tabs/windows in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) commit(load(), false);
  });
}

const update = (id: string, fn: (t: ActiveTimer, now: number) => ActiveTimer) =>
  commit(timers.map((t) => (t.id === id ? fn(t, Date.now()) : t)));

export const timerActions = {
  start(spec: Pick<TimerSpec, 'label' | 'seconds' | 'checks'>, ctx: { recipeId?: string; recipeTitle?: string; stepIndex?: number } = {}) {
    const t = createTimer(spec, { ...ctx, id: uid(), now: Date.now() });
    commit([...timers, t]);
    return t.id;
  },
  pause: (id: string) => update(id, pause),
  resume: (id: string) => update(id, resume),
  restart: (id: string) => {
    dismiss(id);
    update(id, restart);
  },
  add: (id: string, seconds: number) => {
    dismiss(id);
    update(id, (t, now) => addTime(t, seconds, now));
  },
  remove: (id: string) => {
    dismiss(id);
    commit(timers.filter((t) => t.id !== id));
  },
  clearDone: () => {
    ringing = [];
    stopRinging();
    commit(timers.filter((t) => t.status !== 'done'));
  },
  dismiss: (id: string) => dismiss(id),
  dismissCheck: () => {
    lastCheck = null;
    commit(timers, false);
  },
};

function dismiss(id: string) {
  ringing = ringing.filter((r) => r !== id);
  if (!ringing.length) stopRinging();
  snapshot = { timers, ringing, lastCheck };
  subs.forEach((f) => f());
}

function subscribe(fn: () => void) {
  subs.add(fn);
  return () => void subs.delete(fn);
}

export function useTimers() {
  return useSyncExternalStore(subscribe, () => snapshot);
}

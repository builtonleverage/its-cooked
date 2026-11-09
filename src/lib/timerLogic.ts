import type { ActiveTimer, TimerSpec } from './types';

export function createTimer(
  spec: Pick<TimerSpec, 'label' | 'seconds' | 'checks'>,
  ctx: { id: string; now: number; recipeId?: string; recipeTitle?: string; stepIndex?: number },
): ActiveTimer {
  const ms = spec.seconds * 1000;
  return {
    id: ctx.id,
    label: spec.label || 'Timer',
    recipeId: ctx.recipeId,
    recipeTitle: ctx.recipeTitle,
    stepIndex: ctx.stepIndex,
    totalSeconds: spec.seconds,
    endAt: ctx.now + ms,
    remainingMs: ms,
    status: 'running',
    checks: spec.checks
      .filter((c) => c.atSeconds > 0 && c.atSeconds < spec.seconds)
      .sort((a, b) => a.atSeconds - b.atSeconds)
      .map((c) => ({ ...c, fired: false })),
    doneFired: false,
    createdAt: ctx.now,
  };
}

export function remainingMs(t: ActiveTimer, now: number): number {
  if (t.status === 'running') return Math.max(0, t.endAt - now);
  if (t.status === 'paused') return t.remainingMs;
  return 0;
}

export function elapsedSeconds(t: ActiveTimer, now: number): number {
  return t.totalSeconds - remainingMs(t, now) / 1000;
}

export type TimerEvent =
  | { kind: 'check'; timer: ActiveTimer; label: string; lateMs: number }
  | { kind: 'done'; timer: ActiveTimer; lateMs: number };

/**
 * Advances timers to `now`, returning the updated list plus the alerts that should fire.
 * Pure: safe to call after the app was suspended — only the most relevant missed alert fires.
 */
export function advance(timers: ActiveTimer[], now: number): { timers: ActiveTimer[]; events: TimerEvent[]; changed: boolean } {
  const events: TimerEvent[] = [];
  let changed = false;
  const next = timers.map((t) => {
    if (t.status !== 'running') return t;
    const elapsed = elapsedSeconds(t, now);
    if (now >= t.endAt) {
      changed = true;
      const done: ActiveTimer = {
        ...t,
        status: 'done',
        remainingMs: 0,
        doneFired: true,
        checks: t.checks.map((c) => ({ ...c, fired: true })),
      };
      if (!t.doneFired) events.push({ kind: 'done', timer: done, lateMs: now - t.endAt });
      return done;
    }
    const due = t.checks.filter((c) => !c.fired && c.atSeconds <= elapsed);
    if (!due.length) return t;
    changed = true;
    const last = due[due.length - 1];
    const updated = { ...t, checks: t.checks.map((c) => (c.fired || c.atSeconds > elapsed ? c : { ...c, fired: true })) };
    events.push({
      kind: 'check',
      timer: updated,
      label: last.label,
      lateMs: Math.round((elapsed - last.atSeconds) * 1000),
    });
    return updated;
  });
  return { timers: next, events, changed };
}

export function pause(t: ActiveTimer, now: number): ActiveTimer {
  if (t.status !== 'running') return t;
  return { ...t, status: 'paused', remainingMs: Math.max(0, t.endAt - now) };
}

export function resume(t: ActiveTimer, now: number): ActiveTimer {
  if (t.status !== 'paused') return t;
  return { ...t, status: 'running', endAt: now + t.remainingMs };
}

export function addTime(t: ActiveTimer, seconds: number, now: number): ActiveTimer {
  const ms = seconds * 1000;
  if (t.status === 'done') {
    return { ...t, status: 'running', doneFired: false, totalSeconds: t.totalSeconds + seconds, endAt: now + ms, remainingMs: ms };
  }
  if (t.status === 'paused') return { ...t, totalSeconds: t.totalSeconds + seconds, remainingMs: t.remainingMs + ms };
  return { ...t, totalSeconds: t.totalSeconds + seconds, endAt: t.endAt + ms };
}

export function restart(t: ActiveTimer, now: number): ActiveTimer {
  return {
    ...t,
    status: 'running',
    endAt: now + t.totalSeconds * 1000,
    remainingMs: t.totalSeconds * 1000,
    doneFired: false,
    checks: t.checks.map((c) => ({ ...c, fired: false })),
  };
}

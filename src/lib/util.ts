export const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`).slice(0, 36);

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export interface DetectedTimer {
  label: string;
  seconds: number;
  checks: { atSeconds: number; label: string }[];
}

/**
 * Finds durations in step text, e.g. "preheat 10-15 min", "bake for 6–8 minutes, check at 4 min",
 * "rest 20 minutes", "1 hour". Ranges use the upper bound as the timer length and add a check at
 * the lower bound; an explicit "check at N" adds a check-in alert.
 */
export function detectTimers(text: string): DetectedTimer[] {
  const out: DetectedTimer[] = [];
  const unit = '(seconds?|secs?|minutes?|mins?|hours?|hrs?|h|m)\\b';
  const re = new RegExp(`(\\d+(?:\\.\\d+)?)(?:\\s*(?:-|–|—|to)\\s*(\\d+(?:\\.\\d+)?))?\\s*${unit}`, 'gi');
  const toSec = (n: number, u: string) => {
    const k = u.toLowerCase();
    if (k.startsWith('s')) return Math.round(n);
    if (k.startsWith('h')) return Math.round(n * 3600);
    return Math.round(n * 60);
  };
  const checkRe = /check\s+(?:at|after)\s*$/i;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const before = text.slice(0, m.index);
    const lo = toSec(parseFloat(m[1]), m[3]);
    const hi = m[2] ? toSec(parseFloat(m[2]), m[3]) : lo;
    if (checkRe.test(before) && out.length) {
      // "check at 4 min" belongs to the previous timer
      const prev = out[out.length - 1];
      if (lo < prev.seconds && !prev.checks.some((c) => c.atSeconds === lo))
        prev.checks.push({ atSeconds: lo, label: 'Check' });
      continue;
    }
    const words = before
      .split(/[.;,:()]/)
      .pop()!
      .trim()
      .split(/\s+/)
      .filter((w) => w && !/^(for|about|around|approx\.?|the|a|an|and|then|or|another|until)$/i.test(w))
      .slice(-3)
      .join(' ');
    const label = words ? words[0].toUpperCase() + words.slice(1) : 'Timer';
    const checks = hi > lo ? [{ atSeconds: lo, label: 'Check for doneness' }] : [];
    out.push({ label, seconds: hi, checks });
  }
  return out.filter((t) => t.seconds >= 10);
}

export function haptic(pattern: number | number[] = 10) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

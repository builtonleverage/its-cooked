import { useState } from 'react';
import { timerActions, useTimers } from '../lib/timers';
import { TimerCard } from '../components/TimerViews';
import { Icon } from '../components/Icon';
import { notificationsSupported, requestNotificationPermission } from '../lib/alerts';
import { haptic } from '../lib/util';

const presets = [1, 3, 5, 10, 15, 20, 30, 45];

export function TimersPage() {
  const { timers } = useTimers();
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('');
  const [perm, setPerm] = useState(notificationsSupported() ? Notification.permission : 'unsupported');
  const sorted = [...timers].sort((a, b) => {
    const rank = (s: string) => (s === 'running' ? 0 : s === 'paused' ? 1 : 2);
    return rank(a.status) - rank(b.status) || a.endAt - b.endAt;
  });

  const start = (m: number, name?: string) => {
    if (!(m > 0)) return;
    haptic(15);
    void requestNotificationPermission().then((p) => setPerm(p));
    const secs = Math.round(m * 60);
    timerActions.start({
      label: name || label.trim() || `${m} min timer`,
      seconds: secs,
      checks: secs >= 240 ? [{ atSeconds: Math.round(secs / 2), label: 'Halfway check' }] : [],
    });
    setLabel('');
    setMinutes('');
  };

  return (
    <div className="page">
      <h1>Timers</h1>
      {perm === 'default' && (
        <button className="notice action" onClick={() => requestNotificationPermission().then(setPerm)}>
          <Icon name="bell" /> Turn on notifications so timers can alert you when the app is in the background.
        </button>
      )}
      {perm === 'unsupported' && (
        <p className="notice small">
          Notifications aren't available here. On iPhone, add It's Cooked to your Home Screen to get timer notifications.
        </p>
      )}

      {sorted.length === 0 && <p className="muted">No timers yet. Start one from a recipe step, or add a quick timer below.</p>}
      <div className="timer-list">
        {sorted.map((t) => (
          <TimerCard key={t.id} t={t} />
        ))}
      </div>
      {timers.some((t) => t.status === 'done') && (
        <button className="btn ghost small" onClick={timerActions.clearDone}>
          Clear finished
        </button>
      )}

      <section className="quick">
        <h2>Quick timer</h2>
        <form
          className="quick-form"
          onSubmit={(e) => {
            e.preventDefault();
            start(parseFloat(minutes));
          }}
        >
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name (e.g. Tandoor preheat)" aria-label="Timer name" />
          <input className="input" value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="decimal" placeholder="min" aria-label="Minutes" />
          <button className="btn primary" type="submit" disabled={!(parseFloat(minutes) > 0)}>
            Start
          </button>
        </form>
        <div className="chips wrap">
          {presets.map((m) => (
            <button key={m} className="chip" onClick={() => start(m)}>
              {m} min
            </button>
          ))}
        </div>
        <p className="small muted">Quick timers of 4 min or more include a halfway check alert.</p>
      </section>
    </div>
  );
}

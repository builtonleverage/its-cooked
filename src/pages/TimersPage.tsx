import { useState } from 'react';
import { timerActions, useTimers } from '../lib/timers';
import { TimerCard } from '../components/TimerViews';
import { Icon } from '../components/Icon';
import { notificationsSupported, requestNotificationPermission } from '../lib/alerts';
import { haptic } from '../lib/util';
import { useLang, useT } from '../lib/i18n';

const presets = [1, 3, 5, 10, 15, 20, 30, 45];

export function TimersPage() {
  const { timers } = useTimers();
  const t = useT();
  const hi = useLang() === 'hi';
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
      label: name || label.trim() || `${m} ${t('min')} ${hi ? 'टाइमर' : 'timer'}`,
      seconds: secs,
      checks: secs >= 240 ? [{ atSeconds: Math.round(secs / 2), label: hi ? 'आधे समय पर जाँच' : 'Halfway check' }] : [],
    });
    setLabel('');
    setMinutes('');
  };

  return (
    <div className="page">
      <h1>{t('timers')}</h1>
      {perm === 'default' && (
        <button className="notice action" onClick={() => requestNotificationPermission().then(setPerm)}>
          <Icon name="bell" /> {t('enableNotif')}
        </button>
      )}
      {perm === 'unsupported' && (
        <p className="notice small">
          Notifications aren't available here. On iPhone, add It's Cooked to your Home Screen to get timer notifications.
        </p>
      )}

      {sorted.length === 0 && <p className="muted">{t('noTimers')}</p>}
      <div className="timer-list">
        {sorted.map((x) => (
          <TimerCard key={x.id} t={x} />
        ))}
      </div>
      {timers.some((x) => x.status === 'done') && (
        <button className="btn ghost small" onClick={timerActions.clearDone}>
          {t('clearFinished')}
        </button>
      )}

      <section className="quick">
        <h2>{t('quickTimer')}</h2>
        <form
          className="quick-form"
          onSubmit={(e) => {
            e.preventDefault();
            start(parseFloat(minutes));
          }}
        >
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('timerName')} aria-label={t('timerName')} />
          <input className="input" value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="decimal" placeholder={t('min')} aria-label="Minutes" />
          <button className="btn primary" type="submit" disabled={!(parseFloat(minutes) > 0)}>
            {t('start')}
          </button>
        </form>
        <div className="chips wrap">
          {presets.map((m) => (
            <button key={m} className="chip" onClick={() => start(m)}>
              {m} {t('min')}
            </button>
          ))}
        </div>
        <p className="small muted">{t('halfwayNote')}</p>
      </section>
    </div>
  );
}

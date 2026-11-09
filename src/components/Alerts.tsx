import { timerActions, useTimers } from '../lib/timers';
import { navigate } from '../lib/router';
import { Icon } from './Icon';
import { useEffect } from 'react';

/** Full-width banners for a finished timer (until stopped) and check-in alerts. */
export function AlertLayer() {
  const { timers, ringing, lastCheck } = useTimers();
  const ring = timers.filter((t) => ringing.includes(t.id));

  useEffect(() => {
    if (!lastCheck) return;
    const id = setTimeout(() => timerActions.dismissCheck(), 12_000);
    return () => clearTimeout(id);
  }, [lastCheck]);

  if (!ring.length && !lastCheck) return null;
  return (
    <div className="alert-layer" role="alert" aria-live="assertive">
      {ring.map((t) => (
        <div key={t.id} className="alert done">
          <Icon name="bell" size={28} />
          <div className="alert-text">
            <strong>{t.label} is done</strong>
            {t.recipeTitle && <span className="small">{t.recipeTitle}</span>}
          </div>
          <button className="btn light" onClick={() => timerActions.add(t.id, 60)}>
            +1 min
          </button>
          <button className="btn dark" onClick={() => timerActions.dismiss(t.id)} autoFocus>
            Stop
          </button>
        </div>
      ))}
      {lastCheck && (
        <div className="alert check">
          <Icon name="timer" size={26} />
          <div className="alert-text">
            <strong>Check now</strong>
            <span className="small">{lastCheck.label}</span>
          </div>
          <button
            className="btn light"
            onClick={() => {
              timerActions.dismissCheck();
              navigate('/timers');
            }}
          >
            Timers
          </button>
          <button className="btn dark" onClick={() => timerActions.dismissCheck()}>
            OK
          </button>
        </div>
      )}
    </div>
  );
}

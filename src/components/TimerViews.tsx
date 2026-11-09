import type { ActiveTimer, TimerSpec } from '../lib/types';
import { remainingMs } from '../lib/timerLogic';
import { timerActions, useTimers } from '../lib/timers';
import { formatClock, haptic } from '../lib/util';
import { Icon } from './Icon';
import { requestNotificationPermission } from '../lib/alerts';
import { fmtDur, useLang, useT } from '../lib/i18n';

export function Ring({ progress, size = 64, stroke = 6, children }: { progress: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-fg"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progress)))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

export function TimerCard({ t, big = false }: { t: ActiveTimer; big?: boolean }) {
  const { ringing } = useTimers();
  const t_ = useT();
  const lang = useLang();
  const left = remainingMs(t, Date.now());
  const progress = 1 - left / (t.totalSeconds * 1000);
  const isRinging = ringing.includes(t.id);
  const nextCheck = t.checks.find((c) => !c.fired);
  return (
    <article className={`timer-card ${t.status} ${isRinging ? 'ringing' : ''} ${big ? 'big' : ''}`} aria-live="off">
      <Ring progress={t.status === 'done' ? 1 : progress} size={big ? 92 : 68} stroke={big ? 8 : 6}>
        <Icon name={t.status === 'done' ? 'check' : 'timer'} size={big ? 26 : 20} />
      </Ring>
      <div className="timer-main">
        <div className="timer-label">{t.label}</div>
        <div className="timer-clock" role="timer" aria-label={`${t.label}: ${formatClock(left)} left`}>
          {t.status === 'done' ? t_('doneBang') : formatClock(left)}
        </div>
        <div className="timer-sub">
          {t.status === 'paused' && <span className="pill warn">{t_('paused')}</span>}
          {nextCheck && t.status !== 'done' && (
            <span className="pill">{t_('checkAt', { t: fmtDur(nextCheck.atSeconds, lang) })}</span>
          )}
          {t.recipeTitle && <span className="muted ellipsis">{t.recipeTitle}{t.stepIndex != null ? ` · step ${t.stepIndex + 1}` : ''}</span>}
        </div>
      </div>
      <div className="timer-actions">
        {isRinging ? (
          <button className="btn primary" onClick={() => timerActions.dismiss(t.id)}>
            {t_('stop')}
          </button>
        ) : t.status === 'running' ? (
          <button className="icon-btn lg" onClick={() => timerActions.pause(t.id)} aria-label={`Pause ${t.label}`}>
            <Icon name="pause" />
          </button>
        ) : t.status === 'paused' ? (
          <button className="icon-btn lg" onClick={() => timerActions.resume(t.id)} aria-label={`Resume ${t.label}`}>
            <Icon name="play" />
          </button>
        ) : (
          <button className="icon-btn lg" onClick={() => timerActions.restart(t.id)} aria-label={`Restart ${t.label}`}>
            <Icon name="restart" />
          </button>
        )}
        <div className="row tight">
          <button className="chip" onClick={() => timerActions.add(t.id, 60)} aria-label={`Add one minute to ${t.label}`}>
            +1m
          </button>
          <button className="icon-btn sm" onClick={() => timerActions.remove(t.id)} aria-label={`Delete ${t.label}`}>
            <Icon name="close" size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

/** "Start" button for a timer defined on a recipe step. */
export function StartTimerButton({
  spec,
  recipeId,
  recipeTitle,
  stepIndex,
}: {
  spec: TimerSpec;
  recipeId: string;
  recipeTitle: string;
  stepIndex: number;
}) {
  const t = useT();
  const lang = useLang();
  const checks = spec.checks.map((c) => fmtDur(c.atSeconds, lang)).join(', ');
  return (
    <button
      className="timer-start"
      onClick={() => {
        haptic(15);
        void requestNotificationPermission();
        timerActions.start(spec, { recipeId, recipeTitle, stepIndex });
      }}
    >
      <Icon name="timer" />
      <span>
        <strong>{spec.label}</strong>
        <span className="small">
          {fmtDur(spec.seconds, lang)}
          {checks && ` · ${t('checkAt', { t: checks })}`}
        </span>
      </span>
      <span className="go">{t('start')}</span>
    </button>
  );
}

import { useRef, useState } from 'react';
import { useTheme, type ThemePref } from '../lib/theme';
import { exportAll, importAll } from '../lib/db';
import { ensureSeed } from '../lib/bootstrap';
import { notificationsSupported, notify, playChime, requestNotificationPermission, vibrate } from '../lib/alerts';
import { Icon, Logo } from '../components/Icon';

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

export function SettingsPage() {
  const [theme, setTheme] = useTheme();
  const [perm, setPerm] = useState(notificationsSupported() ? Notification.permission : 'unsupported');
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);

  return (
    <div className="page">
      <h1>Settings</h1>

      {!isStandalone && (
        <section className="status-card">
          <Logo size={40} />
          <div>
            <strong>Install It's Cooked</strong>
            <p className="small">
              {isIOS
                ? 'In Safari, tap the Share button, then “Add to Home Screen”. Installing enables timer notifications on iPhone.'
                : 'Use your browser menu → “Install app” or “Add to Home screen” for a full-screen, offline app.'}
            </p>
          </div>
        </section>
      )}

      <section>
        <h2>Appearance</h2>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {(['system', 'light', 'dark'] as ThemePref[]).map((t) => (
            <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Timer alerts</h2>
        <p className="small muted">
          Notifications: <strong>{perm}</strong>
        </p>
        <div className="row wrap">
          {perm === 'default' && (
            <button className="btn" onClick={() => requestNotificationPermission().then(setPerm)}>
              <Icon name="bell" /> Enable notifications
            </button>
          )}
          <button
            className="btn"
            onClick={() => {
              playChime('done');
              vibrate('done');
              void notify("⏰ It's Cooked test", 'This is how a finished timer alerts you.', 'test');
            }}
          >
            Test alert
          </button>
        </div>
        <p className="small muted">
          Timers keep counting while you switch apps or reload. On iPhone, Safari pauses web apps in the background, so the alert fires the moment you return —
          keep the screen on with Cook Mode for exact alerts.
        </p>
      </section>

      <section>
        <h2>Backup</h2>
        <div className="row wrap">
          <button
            className="btn"
            onClick={async () => {
              const blob = new Blob([await exportAll()], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `its-cooked-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            }}
          >
            <Icon name="share" /> Export recipes
          </button>
          <button className="btn" onClick={() => file.current?.click()}>
            <Icon name="download" /> Import
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const n = await importAll(await f.text());
                setMsg(`Imported ${n} recipe${n === 1 ? '' : 's'}.`);
              } catch (err: any) {
                setMsg(`Import failed: ${err.message}`);
              }
              e.target.value = '';
            }}
          />
          <button
            className="btn ghost"
            onClick={async () => {
              await ensureSeed(true);
              setMsg('Sample recipe restored.');
            }}
          >
            Restore sample recipe
          </button>
        </div>
        {msg && (
          <p className="small" role="status">
            {msg}
          </p>
        )}
      </section>

      <section>
        <h2>About</h2>
        <div className="about">
          <Logo size={56} />
          <div>
            <strong>It's Cooked</strong> v{__APP_VERSION__}
            <p className="small muted">
              Your data stays on this device — no account, no tracking. Images come only from openly-licensed sources (Wikimedia Commons, Openverse) with
              author and licence shown.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

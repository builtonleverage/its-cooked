import { useEffect, useState } from 'react';
import { match, navigate, useRoute } from './lib/router';
import { useOnline } from './lib/hooks';
import { useTimers } from './lib/timers';
import { remainingMs } from './lib/timerLogic';
import { formatClock } from './lib/util';
import { Icon } from './components/Icon';
import { AlertLayer } from './components/Alerts';
import { Library } from './pages/Library';
import { RecipeView } from './pages/RecipeView';
import { RecipeEdit } from './pages/RecipeEdit';
import { CookMode } from './pages/CookMode';
import { TimersPage } from './pages/TimersPage';
import { SavedPage } from './pages/SavedPage';
import { SettingsPage } from './pages/SettingsPage';
import { useRegisterSW } from 'virtual:pwa-register/react';

const tabs = [
  { path: '/', label: 'Recipes', icon: 'book' },
  { path: '/timers', label: 'Timers', icon: 'timer' },
  { path: '/saved', label: 'Offline', icon: 'download' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export function App() {
  const route = useRoute();
  const online = useOnline();
  const cook = match(route, '/cook/:id');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  let page: React.ReactNode;
  let p: Record<string, string> | null;
  if ((p = match(route, '/recipe/:id'))) page = <RecipeView id={p.id} />;
  else if ((p = match(route, '/edit/:id'))) page = <RecipeEdit id={p.id} />;
  else if (match(route, '/new')) page = <RecipeEdit />;
  else if (cook) page = <CookMode id={cook.id} />;
  else if (match(route, '/timers')) page = <TimersPage />;
  else if (match(route, '/saved')) page = <SavedPage />;
  else if (match(route, '/settings')) page = <SettingsPage />;
  else page = <Library />;

  const activeTab = tabs.find((t) => (t.path === '/' ? !tabs.slice(1).some((x) => route.startsWith(x.path)) : route.startsWith(t.path)));

  return (
    <div className={`app ${cook ? 'cooking' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {!online && (
        <div className="offline-bar" role="status">
          <Icon name="wifiOff" size={16} /> Offline — your recipes and timers still work
        </div>
      )}
      <main id="main" key={route.split('?')[0]}>
        {page}
      </main>
      {!cook && <TimerDock />}
      {!cook && (
        <nav className="tabbar" aria-label="Main">
          {tabs.map((t) => (
            <a key={t.path} href={`#${t.path}`} className={activeTab === t ? 'on' : ''} aria-current={activeTab === t ? 'page' : undefined}>
              <Icon name={t.icon} size={24} />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
      )}
      <AlertLayer />
      <UpdatePrompt />
    </div>
  );
}

/** Small floating pill showing the soonest running timer on every screen. */
function TimerDock() {
  const { timers } = useTimers();
  const route = useRoute();
  const running = timers.filter((t) => t.status === 'running').sort((a, b) => a.endAt - b.endAt);
  if (!running.length || route.startsWith('/timers')) return null;
  const t = running[0];
  return (
    <button className="timer-dock" onClick={() => navigate('/timers')} aria-label={`${running.length} timers running. Open timers`}>
      <Icon name="timer" size={18} />
      <span className="ellipsis">{t.label}</span>
      <strong>{formatClock(remainingMs(t, Date.now()))}</strong>
      {running.length > 1 && <span className="pill">+{running.length - 1}</span>}
    </button>
  );
}

function UpdatePrompt() {
  const [dismissed, setDismissed] = useState(false);
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    if (!offlineReady) return;
    const id = setTimeout(() => setOfflineReady(false), 4000);
    return () => clearTimeout(id);
  }, [offlineReady, setOfflineReady]);
  if (offlineReady)
    return (
      <div className="toast" role="status">
        <Icon name="check" size={18} /> Ready to work offline
      </div>
    );
  if (needRefresh && !dismissed)
    return (
      <div className="toast" role="status">
        New version available
        <button className="btn small primary" onClick={() => updateServiceWorker(true)}>
          Update
        </button>
        <button className="icon-btn sm" onClick={() => setDismissed(true)} aria-label="Later">
          <Icon name="close" size={16} />
        </button>
      </div>
    );
  return null;
}

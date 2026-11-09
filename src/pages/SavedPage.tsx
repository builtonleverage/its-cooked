import { useEffect, useState } from 'react';
import { useOnline, useRecipes } from '../lib/hooks';
import { makeOffline, offlineSizes, onDataChange, removeOffline } from '../lib/db';
import { formatBytes } from '../lib/util';
import { Icon } from '../components/Icon';

export function SavedPage() {
  const recipes = useRecipes();
  const online = useOnline();
  const [sizes, setSizes] = useState<Map<string, number>>(new Map());
  const [estimate, setEstimate] = useState<{ usage?: number; quota?: number }>({});
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = () => {
      offlineSizes().then(setSizes);
      navigator.storage?.estimate?.().then(setEstimate);
      navigator.storage?.persisted?.().then(setPersisted);
    };
    load();
    return onDataChange(load);
  }, []);

  const saved = recipes?.filter((r) => r.offlineAt) ?? [];
  const notSaved = recipes?.filter((r) => !r.offlineAt) ?? [];

  return (
    <div className="page">
      <h1>Offline</h1>
      <div className={`status-card ${online ? 'ok' : 'off'}`} role="status">
        <Icon name={online ? 'check' : 'wifiOff'} />
        <div>
          <strong>{online ? 'Online' : 'You are offline'}</strong>
          <p className="small">
            The app itself always works offline once installed. All your recipes live on this device; “Download for offline” also saves their photos and
            diagrams.
          </p>
        </div>
      </div>

      {estimate.usage != null && (
        <p className="small muted">
          Using {formatBytes(estimate.usage)}
          {estimate.quota ? ` of ~${formatBytes(estimate.quota)} available` : ''} on this device.
          {persisted === false && (
            <>
              {' '}
              <button
                className="linklike"
                onClick={async () => setPersisted((await navigator.storage?.persist?.()) ?? false)}
              >
                Protect from automatic clean-up
              </button>
            </>
          )}
          {persisted && ' Storage is protected from automatic clean-up.'}
        </p>
      )}

      <h2>Downloaded ({saved.length})</h2>
      {saved.length === 0 && <p className="muted">Nothing downloaded yet. Open a recipe and tap “Download for offline”.</p>}
      <ul className="list">
        {saved.map((r) => (
          <li key={r.id} className="list-row">
            <a href={`#/recipe/${r.id}`} className="grow">
              <strong>{r.title}</strong>
              <span className="small muted">
                {formatBytes(sizes.get(r.id) ?? 0)} of images · saved {new Date(r.offlineAt!).toLocaleDateString()}
              </span>
            </a>
            <button className="icon-btn" onClick={() => removeOffline(r.id)} aria-label={`Remove offline copy of ${r.title}`}>
              <Icon name="trash" />
            </button>
          </li>
        ))}
      </ul>

      {notSaved.length > 0 && (
        <>
          <h2>Not downloaded ({notSaved.length})</h2>
          <button
            className="btn block"
            disabled={busy || !online}
            onClick={async () => {
              setBusy(true);
              for (const r of notSaved) await makeOffline(r);
              setBusy(false);
            }}
          >
            <Icon name="download" /> {busy ? 'Downloading…' : 'Download all'}
          </button>
          <ul className="list">
            {notSaved.map((r) => (
              <li key={r.id} className="list-row">
                <a href={`#/recipe/${r.id}`} className="grow">
                  {r.title}
                </a>
                <button className="icon-btn" disabled={!online} onClick={() => makeOffline(r)} aria-label={`Download ${r.title} for offline`}>
                  <Icon name="download" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

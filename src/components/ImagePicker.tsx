import { useEffect, useRef, useState } from 'react';
import type { ImageCredit } from '../lib/types';
import { searchOpenverse, searchWikimedia } from '../lib/images';
import { Icon } from './Icon';
import { CreditLine } from './Credit';
import { Sheet } from './Sheet';
import { useOnline } from '../lib/hooks';

export function ImagePicker({
  initialQuery,
  onPick,
  onClose,
}: {
  initialQuery: string;
  onPick: (c: ImageCredit) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState(initialQuery);
  const [source, setSource] = useState<'wikimedia' | 'openverse'>('wikimedia');
  const [results, setResults] = useState<ImageCredit[] | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ImageCredit | null>(null);
  const abort = useRef<AbortController | null>(null);
  const online = useOnline();

  const run = async () => {
    if (!q.trim()) return;
    abort.current?.abort();
    const ac = (abort.current = new AbortController());
    setResults(null);
    setError('');
    setSelected(null);
    try {
      const r = await (source === 'wikimedia' ? searchWikimedia : searchOpenverse)(q.trim(), ac.signal);
      setResults(r);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message || 'Search failed');
      setResults([]);
    }
  };

  useEffect(() => {
    if (online) void run();
    return () => abort.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  return (
    <Sheet title="Find a free image" onClose={onClose} tall>
      <p className="muted small">
        Only openly-licensed images (CC0, public domain, CC BY, CC BY-SA) are shown. The author and licence are saved with the
        recipe and displayed under the image.
      </p>
      <form
        className="search-row"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. paratha" enterKeyHint="search" />
        <button className="btn primary" type="submit" disabled={!online}>
          <Icon name="search" />
          <span className="sr-only">Search</span>
        </button>
      </form>
      <div className="segmented" role="tablist" aria-label="Image source">
        {(['wikimedia', 'openverse'] as const).map((s) => (
          <button key={s} role="tab" aria-selected={source === s} className={source === s ? 'on' : ''} onClick={() => setSource(s)}>
            {s === 'wikimedia' ? 'Wikimedia Commons' : 'Openverse'}
          </button>
        ))}
      </div>
      {!online && <p className="notice">You're offline — image search needs a connection.</p>}
      {error && <p className="notice">{error}</p>}
      {online && results === null && <p className="muted center pad">Searching…</p>}
      {results?.length === 0 && !error && <p className="muted center pad">No openly-licensed images found. Try another word.</p>}
      <div className="img-grid">
        {results?.map((r) => (
          <button
            key={r.url}
            className={`img-tile ${selected?.url === r.url ? 'sel' : ''}`}
            onClick={() => setSelected(r)}
            aria-pressed={selected?.url === r.url}
          >
            <img src={r.url} alt={r.title} loading="lazy" />
            <span className="lic">{r.license}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="pick-bar">
          <div className="small">
            <CreditLine credit={selected} />
          </div>
          <button className="btn primary block" onClick={() => onPick(selected)}>
            <Icon name="check" /> Use this image
          </button>
        </div>
      )}
    </Sheet>
  );
}

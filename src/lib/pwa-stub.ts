// Used by the single-file embedded build, which has no service worker.
import { useState } from 'react';
export function useRegisterSW() {
  const needRefresh = useState(false);
  const offlineReady = useState(false);
  return { needRefresh, offlineReady, updateServiceWorker: async (_reload?: boolean) => {} };
}

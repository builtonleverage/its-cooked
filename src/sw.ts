/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// App shell: every built asset is precached so the app opens instantly and fully offline.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL(`${import.meta.env.BASE_URL}index.html`)));

// Openly-licensed images viewed while browsing (offline-downloaded recipes are stored in IndexedDB).
registerRoute(
  ({ url }) => url.hostname === 'upload.wikimedia.org' || url.hostname.endsWith('openverse.org'),
  new CacheFirst({
    cacheName: 'remote-images',
    plugins: [new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 60 })],
  }),
);
registerRoute(({ url }) => url.hostname === 'fonts.gstatic.com', new StaleWhileRevalidate({ cacheName: 'fonts' }));

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

// Tapping a timer notification focuses the app (or opens it) on the timers screen.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data?.url as string) || self.registration.scope;
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of clients) {
        if ('focus' in c) {
          await c.focus();
          (c as WindowClient).navigate?.(target).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});

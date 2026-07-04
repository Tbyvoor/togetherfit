'use strict';
// Service worker: netwerk eerst, cache als fallback — zodat de app
// offline blijft werken zodra hij één keer geladen is (vereist HTTPS-hosting).
const CACHE = 'fitpad-v2';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    // 'no-store' negeert de browser-HTTP-cache, zodat we nooit een
    // verouderde pagina serveren zolang er wél internet is.
    fetch(e.request, { cache: 'no-store' }).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() =>
      caches.match(e.request).then(m => m || caches.match('./'))
    )
  );
});

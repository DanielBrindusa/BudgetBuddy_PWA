// BudgetBuddy PWA offline cache
const CACHE_VERSION = 'v6'; // bumped so clients fetch the updated HTML
const CACHE_NAME = `budgetbuddy-${CACHE_VERSION}`;

const ASSETS = [
  './',
  './budgetbuddy.html',
  './manifest.webmanifest'
  // Add icons here if you create them:
  // './icon-192.png',
  // './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // For navigations: network first, fallback to cached shell
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./budgetbuddy.html')) || Response.error();
      }
    })());
    return;
  }

  // For others: cache-first
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (req.method === 'GET' && res && res.status === 200 && new URL(req.url).origin === location.origin) {
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      return new Response('Offline and not cached.', { status: 503, statusText: 'Service Unavailable' });
    }
  })());
});

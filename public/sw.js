const CACHE_NAME = 'watdongos-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/personal-schedule',
  '/dashboard/personal-finance',
  '/dashboard/finance',
  '/dashboard/monks',
  '/dashboard/schedule',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache fallback:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network First with Cache Fallback for Pages, Stale-While-Revalidate for Static)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Skip non-GET and chrome-extension requests
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  // Network-First strategy for pages and API
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache if network fails
        const cachedResponse = await caches.match(req);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback to main offline dashboard page
        if (req.headers.get('accept')?.includes('text/html')) {
          return caches.match('/dashboard');
        }
      })
  );
});

/* জনতার কথা — service worker.
 *
 * Phase 8: push + notificationclick handlers (keep them below).
 * Phase 12: PWA offline caching — cache-first for app shell + static
 * assets, network-first for API/HTML, offline fallback page (/offline).
 */

const CACHE_VERSION = 'jk-pwa-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// App shell essentials — cached on install so the offline page always works.
const PRECACHE_URLS = ['/', '/offline', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('jk-pwa-') && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/manifest.json' ||
    /\.(png|jpe?g|webp|gif|svg|css|js|woff2?)$/i.test(url.pathname)
  );
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, res.clone());
  }
  return res;
}

async function networkFirst(request, cacheName, fallback) {
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallback) {
      const fb = await caches.match(fallback);
      if (fb) return fb;
    }
    throw new Error('offline');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin requests; leave fonts/APIs from other origins alone.
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    // Cache-first for the app shell + static assets.
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    // Network-first for API calls.
    event.respondWith(networkFirst(request, RUNTIME_CACHE, null));
    return;
  }

  // Navigations / pages: network-first, offline → /offline page.
  event.respondWith(networkFirst(request, RUNTIME_CACHE, '/offline'));
});

// ---- Phase 8 push + notification handlers (keep working) ----

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* ignore malformed payloads */
  }
  const title = data.title || 'জনতার কথা';
  const options = {
    body: data.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});

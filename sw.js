// ─────────────────────────────────────────────────────────────
// Service Worker — Career Counseling by Ayan Pekhuya
// Cache-first strategy: full offline support
// ─────────────────────────────────────────────────────────────

const CACHE_NAME = 'career-counseling-v1';
const BASE = '/CareerCounseling';

// Files to cache on install
const PRECACHE_URLS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
];

// ── INSTALL: cache core files ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: remove old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first, fallback to network ──
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Cache valid responses
          if (
            response &&
            response.status === 200 &&
            response.type === 'basic'
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(event.request, clone)
            );
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: serve index.html for navigation
          if (event.request.mode === 'navigate') {
            return caches.match(BASE + '/index.html');
          }
        });
    })
  );
});

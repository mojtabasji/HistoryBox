// Basic service worker for History Box PWA
// (No build step; placed in /public so it's served at /sw.js)
// Improve later with Workbox or custom strategies.
const CACHE_NAME = 'historybox-v1';
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const acceptHeader = request.headers.get('accept') || '';
  const isHtmlNavigation = acceptHeader.includes('text/html');
  const url = new URL(request.url);

  // Network-first for API requests
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Always go to network for sitemap so it reflects latest data.
  if (url.pathname === '/sitemap.xml') {
    event.respondWith(fetch(request));
    return;
  }

  // Always go to network for HTML/navigation requests so dynamic pages
  // like /blog and blog posts are never served stale from the SW cache.
  if (isHtmlNavigation) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request) || caches.match('/'))
    );
    return;
  }

  // Cache-first for same-origin static assets (JS, CSS, images, etc.)
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(resp => {
        if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return resp;
      });
    })
  );
});

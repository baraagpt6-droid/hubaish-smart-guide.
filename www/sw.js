'use strict';

const CACHE_NAME = 'hubaish-guide-v4.0.5';
const BASE_URL = new URL('./', self.registration.scope);
const INDEX_URL = new URL('index.html', BASE_URL).href;
const REMOTE_IMAGE_HOSTS = new Set(['upload.wikimedia.org', 'al-jandprovince.com', 'hekmahyemanya.com']);
const APP_SHELL = [
  '', 'index.html', 'styles.css', 'splash.js', 'app.js', 'catalog.js', 'features.js', 'gallery.js', 'upgrade-400.js', 'manifest.json',
  'manifest.webmanifest', 'github-cms.js', 'data/live-content.json', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/photo-fallback.svg'
].map(path => new URL(path, BASE_URL).href);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('hubaish-guide-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    if (request.destination !== 'image' || !REMOTE_IMAGE_HOSTS.has(url.hostname)) return;
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        try {
          const response = await fetch(request);
          if (response.ok || response.type === 'opaque') {
            await cache.put(request, response.clone());
            return response;
          }
          const fallback = await cache.match(new URL('icons/photo-fallback.svg', BASE_URL).href);
          return fallback || response;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          const fallback = await cache.match(new URL('icons/photo-fallback.svg', BASE_URL).href);
          return fallback || new Response('', { status: 503, statusText: 'Image unavailable offline' });
        }
      })
    );
    return;
  }
  if (!url.href.startsWith(BASE_URL.href)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(INDEX_URL, copy)));
        }
        return response;
      }).catch(() => caches.match(INDEX_URL))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw new Error('Network unavailable and resource is not cached');
      }
    })
  );
});

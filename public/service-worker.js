/* eslint-disable no-restricted-globals */

// Self-destructing Service Worker
// This replaces the old SW to ensure caches are cleared and clients are claimed immediately.

const CACHE_NAME = 'cleanup-cache-v2';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing cleanup worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating cleanup worker...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          console.log('[Service Worker] Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log('[Service Worker] All caches deleted.');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Pass through to network - no caching
  return;
});
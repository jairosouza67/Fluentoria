/* eslint-disable no-restricted-globals */

// Fluentoria Service Worker - Offline Support
const CACHE_VERSION = 'v5';
const STATIC_CACHE = `fluentoria-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `fluentoria-dynamic-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Known static CDNs used by the app (importmap + fonts).
// These requests are safe to cache as opaque responses.
const STATIC_CDN_HOSTS = [
  'aistudiocdn.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/offline.html',
  '/logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/app-bg.png',
  '/instructor-photo.png',
  '/overlay-chef.png',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      console.log('[Service Worker] Caching static assets');

      // Cache assets individually so a missing file doesn't break SW install.
      await Promise.allSettled(
        STATIC_ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn('[Service Worker] Failed to cache:', asset, error);
          }
        })
      );

      console.log('[Service Worker] Skip waiting');
      await self.skipWaiting();
    })()
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key.startsWith('fluentoria-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET; let POST/PUT/etc hit the network.
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Skip video and audio requests to avoid range request issues
  if (request.destination === 'video' || request.destination === 'audio') {
    return;
  }

  // Avoid a known fetch() failure mode in service workers.
  // See: only-if-cached is only valid with mode=same-origin.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;

  const isStaticCdn = STATIC_CDN_HOSTS.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
  );

  // Navigation: app-shell fallback for SPA
  if (request.mode === 'navigate') {
    event.respondWith(navigateWithAppShell(request));
    return;
  }

  // Network-first for API calls (Firebase, external APIs)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firebaseio') ||
    url.pathname.startsWith('/api')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets (same-origin bundles + known CDNs like importmap/Google Fonts).
  if (
    (isSameOrigin || isStaticCdn) &&
    (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.destination === 'font')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: try network, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        
        // If it's a navigation request, return the offline page
        if (request.mode === 'navigate') {
          const offlinePage = await caches.match(OFFLINE_PAGE);
          if (offlinePage) return offlinePage;
        }
        
        // For other requests, return a proper error response
        return new Response('Network error occurred', {
          status: 408,
          statusText: 'Network Error'
        });
      })
  );
});

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
      const cache = await caches.open(DYNAMIC_CACHE);
      if (isCacheableResponse(request, networkResponse)) {
        cache.put(request, networkResponse.clone());
      }
    }
    return networkResponse;
  } catch (error) {
    const fallback = await caches.match(request);
    if (fallback) {
      return fallback;
    }
    console.error('[Service Worker] Fetch failed:', error);
    return Response.error();
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
      const cache = await caches.open(DYNAMIC_CACHE);
      if (isCacheableResponse(request, networkResponse)) {
        cache.put(request, networkResponse.clone());
      }
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    console.error('[Service Worker] Network-first failed:', error);
    return Response.error();
  }
}

function isCacheableResponse(request, response) {
  // Opaque responses (cross-origin no-cors) have no readable headers; safe to cache.
  if (response.type === 'opaque') {
    return true;
  }

  const contentType = response.headers.get('content-type') || '';
  switch (request.destination) {
    case 'image':
      return contentType.startsWith('image/');
    case 'style':
      return contentType.includes('text/css');
    case 'script':
      return contentType.includes('javascript') || contentType.includes('ecmascript');
    case 'font':
      return contentType.includes('font/') || contentType.includes('woff') || contentType.includes('opentype');
    default:
      return true;
  }
}

// Navigation handler: network-first, then cached app shell, then offline page.
async function navigateWithAppShell(request) {
  try {
    // Prefer live HTML so users get updates when online.
    return await fetch(request);
  } catch (error) {
    // First, try a cached response for the exact navigation request (e.g. '/').
    const cachedNavigation = await caches.match(request);
    if (cachedNavigation) {
      return cachedNavigation;
    }

    // App shell (SPA) fallback
    const appShell = await caches.match('/index.html');
    if (appShell) {
      return appShell;
    }
    const offlinePage = await caches.match(OFFLINE_PAGE);
    if (offlinePage) {
      return offlinePage;
    }
    throw error;
  }
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
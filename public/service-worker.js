/* eslint-disable no-restricted-globals */

// Nome do cache para versionamento
const CACHE_NAME = 'dark-lms-cache-v1';

// Arquivos essenciais para o App Shell (funcionamento offline básico)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Instalação: Cache dos assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Força o SW a ativar imediatamente
  self.skipWaiting();
});

// 2. Ativação: Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Reivindica o controle dos clientes imediatamente
  self.clients.claim();
});

// 3. Fetch: Estratégia híbrida
// - Assets estáticos (JS, CSS, Imagens): Cache First, falling back to Network
// - API/Dados: Network First, falling back to Cache (para simular aqui, tratamos tudo como asset por enquanto)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET ou sejam extensões do Chrome, etc.
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se tiver no cache, retorna. Se não, busca na rede.
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Verifica se a resposta é válida antes de cachear
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }

        // Clona a resposta para salvar no cache e retornar ao browser
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback para página offline se necessário (opcional)
        // return caches.match('/offline.html');
      });
    })
  );
});
// Service Worker for Stock Scanner PWA

const CACHE_NAME = 'stock-scanner-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// インストールイベント
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Installing and caching app shell');
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('[Service Worker] Error caching URLs:', err);
      });
    })
  );
  self.skipWaiting();
});

// アクティベーションイベント
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// フェッチイベント（キャッシュ優先戦略）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API リクエストはネットワーク優先
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静的アセットはキャッシュ優先
  event.respondWith(cacheFirst(request));
});

// キャッシュ優先戦略
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.error('[Service Worker] Fetch error:', err);
    return new Response('Offline', { status: 503 });
  }
}

// ネットワーク優先戦略
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (err) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// バックグラウンド同期（オプション）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-predictions') {
    event.waitUntil(syncPredictions());
  }
});

async function syncPredictions() {
  try {
    // バックグラウンドで予測データを同期
    console.log('[Service Worker] Background sync initiated');
  } catch (err) {
    console.error('[Service Worker] Sync error:', err);
  }
}

// プッシュ通知（オプション）
self.addEventListener('push', (event) => {
  const data = event.data?.json?.() ?? {};
  const options = {
    body: data.message || 'Stock Scanner update',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  };

  event.waitUntil(
    self.registration.showNotification('Stock Scanner', options)
  );
});

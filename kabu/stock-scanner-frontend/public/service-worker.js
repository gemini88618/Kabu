const CACHE_NAME = 'stock-scanner-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.png'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(() => {
                // Graceful handling if some assets fail to cache
                console.log('Some assets failed to cache');
            });
        })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Cache first for static assets, network first for API
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API requests - network first
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        // Clone and cache the response
                        const cache_response = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, cache_response);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached response if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Static assets - cache first
    event.respondWith(
        caches
            .match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then((response) => {
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        const cache_response = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, cache_response);
                        });

                        return response;
                    })
                    .catch(() => {
                        // Return offline page if available
                        return caches.match('/index.html');
                    });
            })
    );
});

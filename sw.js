// SERVICE WORKER - CACHE STRATEGY
const CACHE_NAME = 'otaku-city-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// CRITICAL RESOURCES TO CACHE
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.min.css',
    '/js/script.min.js',
    '/pages/catalogo.html',
    '/pages/contato.html',
    '/pages/onepiece.html',
    'https://i.ibb.co/5fx7ydb/OC.png',
    'https://i.ibb.co/y3wvPbx/OCT.png'
];

// INSTALL EVENT - CACHE STATIC ASSETS
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ACTIVATE EVENT - CLEAN OLD CACHES
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// FETCH EVENT - CACHE STRATEGY
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // CACHE FIRST FOR STATIC ASSETS
    if (STATIC_ASSETS.includes(request.url) || request.url.includes('.css') || request.url.includes('.js')) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    return response || fetch(request)
                        .then(fetchResponse => {
                            return caches.open(STATIC_CACHE)
                                .then(cache => {
                                    cache.put(request, fetchResponse.clone());
                                    return fetchResponse;
                                });
                        });
                })
        );
        return;
    }

    // NETWORK FIRST FOR IMAGES
    if (request.destination === 'image') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request);
                })
        );
        return;
    }

    // NETWORK FIRST FOR OTHER REQUESTS
    event.respondWith(
        fetch(request)
            .catch(() => caches.match(request))
    );
});

// BACKGROUND SYNC FOR OFFLINE FUNCTIONALITY
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Implement background sync logic if needed
    return Promise.resolve();
}
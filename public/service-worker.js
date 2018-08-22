var version = 'v1::';
var debugMode = false;
var data = [
    '/'
];
var info = 'color: #1a237e';
var success = 'color: #1b5e20';
var error = 'color: #d50000';
self.addEventListener("install", function(event) {
    if (debugMode) console.log('%cSERVICE WORKER: installing...', info);
    event.waitUntil(
        caches.open(version + 'pwap').then(function(cache) {
            return cache.addAll(data);
        }).then(function() {
            self.skipWaiting();
            if (debugMode) console.log('%cSERVICE WORKER: installation completed.', success);
        })
    );
});

self.addEventListener('activate', function(e) {
    if (debugMode) console.log('%cSERVICE WORKER: activated.', success);
    e.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (key !== version + 'pwap') {
                    if (debugMode) console.log('%cSERVICE WORKER: eliminating old cache ' + key, info);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener("fetch", function(event) {
    if (debugMode) console.log('%cSERVICE WORKER: fetching.', info);
    if (event.request.method !== 'GET') {
        if (debugMode) console.log('%cSERVICE WORKER: fetch ignored GET: ', error);
        if (debugMode) console.log( event.request.method, event.request.url);
        return;
    }
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            var networked = fetch(event.request).then(fetchedFromNetwork, unableToResolve).catch(unableToResolve);
            if (debugMode) console.log("%cSERVICE WORKER: fetch event", info);
            return cached || networked;
            function fetchedFromNetwork(response) {
                var cacheCopy = response.clone();
                if (debugMode) console.log('%cSERVICE WORKER: fetching from network ' + event.request.url, info);
                caches.open(version + 'pagesPwa').then(function add(cache) {
                    cache.put(event.request, cacheCopy);
                }).then(function() {
                    if (debugMode) console.log('%cSERVICE WORKER: cache saved ' + event.request.url, info);
                });
                return response;
            }
            function unableToResolve () {
                if (debugMode) console.log('%cSERVICE WORKER: fetch failed for both cache and network.', error);
                return new Response('<h1>Server not available</h1>', {
                    status: 503,
                    statusText: 'Service not available',
                    headers: new Headers({
                        'Content-Type': 'text/html'
                    })
                });
            }
        })
    );
});
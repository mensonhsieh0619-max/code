const CACHE_NAME = "ai-health-pwa-v3";

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./shared.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./app-user.html",
    "./app-coach.html",
    "./app-nutrition.html",
    "./app-admin.html"
];

const CDN_HOSTS = [
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "cdn.jsdelivr.net"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request)
                .then((networkResponse) => {
                    const requestUrl = new URL(event.request.url);
                    const shouldCache =
                        requestUrl.origin === self.location.origin ||
                        CDN_HOSTS.includes(requestUrl.hostname);

                    if (shouldCache && (networkResponse.ok || networkResponse.type === "opaque")) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }

                    return networkResponse;
                })
                .catch(() => {
                    if (event.request.mode === "navigate") {
                        return caches.match("./index.html");
                    }
                    return caches.match("./index.html");
                });
        })
    );
});

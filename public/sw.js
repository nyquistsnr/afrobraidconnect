const CACHE_NAME = "afrobraid-static-v1";
const STATIC_ASSETS = [
  "/favicon.ico",
  "/favicon_io/favicon-16x16.png",
  "/favicon_io/favicon-32x32.png",
  "/favicon_io/android-chrome-192x192.png",
  "/favicon_io/android-chrome-512x512.png",
  "/favicon_io/apple-touch-icon.png",
  "/logo/logo.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Only cache-serve same-origin static image/icon assets; everything else
// (pages, API calls, auth) always goes to the network so users never see
// stale or logged-out content offline.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!STATIC_ASSETS.includes(url.pathname)) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const responseClone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, responseClone));
          return response;
        }),
    ),
  );
});

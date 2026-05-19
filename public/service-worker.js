const CACHE_NAME = "fieldops-v1";

// Install - skip waiting immediately
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Only cache things we know exist
      return cache.addAll([
        "./",
        "./index.html",
        "./manifest.json",
        "./icons/icon-192.png",
        "./icons/icon-512.png"
      ]).catch(() => {
        // Don't fail install if some assets missing
      });
    })
  );
});

// Activate - clear old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch - network first, cache fallback
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls, POST requests, or chrome-extension
  if (
    request.method !== "GET" ||
    url.protocol === "chrome-extension:" ||
    url.hostname.includes("railway.app") ||
    url.hostname.includes("anthropic.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache good responses for static files
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: try cache first
        return caches.match(request).then(cached => {
          if (cached) return cached;
          // For page navigations, return index.html so app still loads
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
  );
});

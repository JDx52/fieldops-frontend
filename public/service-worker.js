// FieldOps Tech PWA — Service Worker
// Caches core assets so app works offline in the field

const CACHE_NAME = "fieldops-tech-v1";
const STATIC_ASSETS = [
  "/tech",
  "/tech/index.html",
  "/static/js/main.chunk.js",
  "/static/js/bundle.js",
  "/manifest.json",
  "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@500;600;700;800&family=DM+Mono:wght@400;500&display=swap",
];

// ── Install: cache static assets ─────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Some assets failed to cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clear old caches ────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ──────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests — network first, no caching
  if (url.pathname.startsWith("/v1/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            data: null,
            error: { code: "OFFLINE", message: "You are offline. This action will sync when you reconnect." },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // Static assets — cache first, fall back to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache successful GET responses
        if (request.method === "GET" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (request.mode === "navigate") {
          return caches.match("/tech") || caches.match("/tech/index.html");
        }
      });
    })
  );
});

// ── Background sync for offline actions ───────────────────────
// When a tech clocks in/out or updates status offline,
// we queue the action and sync when back online.
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-job-updates") {
    event.waitUntil(syncQueuedUpdates());
  }
});

async function syncQueuedUpdates() {
  // In production: read from IndexedDB queue, POST to API, clear queue
  console.log("Syncing queued offline job updates…");
}

// ── Push notifications (when configured) ─────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "FieldOps", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "fieldops-notif",
      data: { url: data.url || "/tech" },
      actions: data.actions || [],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/tech")
  );
});

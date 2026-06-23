// Service worker for offline use. After one online visit the whole app — UI,
// Next assets, and the mupdf engine — is cached, so it runs with no internet at
// all (great for installing on a phone). Nothing is ever sent anywhere; this
// only reads from the network and stores responses in the local cache.

const CACHE = "pdf-toolkit-v1";

// Critical files precached up front so offline works immediately.
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/wasm/mupdf.js",
  "/wasm/mupdf-wasm.js",
  "/wasm/mupdf-wasm.wasm",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Cache individually so one failure doesn't abort the whole install.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
        ),
      );
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network first, fall back to the cached app shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match("/")) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Everything else: cache-first, then network (and cache what we fetch).
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        return cached ?? Response.error();
      }
    })(),
  );
});

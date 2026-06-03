// Karlito Strength — Service Worker v2
// Handles caching + push notifications

const CACHE = "karlito-v2";
const ASSETS = ["/", "/index.html"];

// ── Install & Cache ───────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activate & Clean old caches ───────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch — network first, cache fallback ─────────────────────
self.addEventListener("fetch", (e) => {
  // Never cache Supabase API calls
  if (e.request.url.includes("supabase.co")) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// ── Push Notifications ────────────────────────────────────────
self.addEventListener("push", (e) => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); }
  catch { data = { title: "Karlito Strength", body: e.data.text() }; }

  const title = data.title || "Karlito Strength";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "ks-notification",
    renotify: true,
    data: { url: data.url || "/" },
    actions: data.actions || [],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ────────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

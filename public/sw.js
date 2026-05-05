const CACHE_NAME = "tomas-pm-v3";
const STATIC_ASSETS = ["/logo.png", "/logo.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/")) return;
  // Network-first strategy: always try network, fallback to cache for static assets only
  if (STATIC_ASSETS.some((a) => e.request.url.endsWith(a))) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
  // For HTML pages and JS chunks, always use network (no caching)
});

// ─── Push Notification Events ───
self.addEventListener("push", (e) => {
  if (!e.data) return;
  try {
    const data = e.data.json();
    const options = {
      body: data.body || "",
      icon: data.icon || "/icon-192x192.png",
      badge: data.badge || "/icon-72x72.png",
      tag: data.tag || "tomas-pm",
      data: data.data || { url: "/" },
      vibrate: [100, 50, 100],
      actions: [
        { action: "open", title: "เปิดดู" },
        { action: "dismiss", title: "ปิด" },
      ],
      requireInteraction: false,
    };
    e.waitUntil(self.registration.showNotification(data.title || "TOMAS PM", options));
  } catch (err) {
    console.error("Push event error:", err);
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  if (e.action === "dismiss") return;
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("pushsubscriptionchange", (e) => {
  // Re-subscribe if subscription changes
  e.waitUntil(
    self.registration.pushManager
      .subscribe(e.oldSubscription?.options || { userVisibleOnly: true })
      .then((sub) => {
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
      })
  );
});

// ColeSistema Mini — Service Worker
// Handles: push notifications, offline cache, background sync

const CACHE_NAME = 'colesistema-v2';
const OFFLINE_URL = '/';

const PRECACHE = [
  '/',
  '/login',
  '/manifest.json',
];

// ── Install & cache ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate & clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first, fallback to cache ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL)))
  );
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'ColeSistema', body: 'Nueva notificación', icon: '/icon-192.png', badge: '/icon-192.png' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch { /* ignore */ }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || 'colesistema-notification',
      renotify: true,
      requireInteraction: false,
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    })
  );
});

// ── postMessage: trigger notification from app ────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, url } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'ColeSistema', {
        body: body || '',
        icon: icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: tag || 'colesistema',
        renotify: true,
        vibrate: [100, 50, 100],
        data: { url: url || '/' },
      })
    );
  }
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

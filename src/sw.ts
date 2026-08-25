/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// L'injection point di VitePWA
const precacheManifest = self.__WB_MANIFEST;
if (precacheManifest) {
  precacheAndRoute(precacheManifest);
}

// Listen for Push events
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'FrigoRadar';
      const options = {
        body: data.body || 'Nuova notifica!',
        icon: '/pwa-192x192.png',
        badge: '/masked-icon.svg',
        data: data.url || '/',
        vibrate: [200, 100, 200]
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("Push data is not JSON:", e);
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('FrigoRadar', { body: text, icon: '/pwa-192x192.png' })
      );
    }
  }
});

// Gestione click sulla notifica
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// Sostituito a build time da vite-plugin-pwa con l'elenco dei file da
// precaricare, ciascuno con la propria revisione.
//
// Finché vite.config.ts dichiarava `injectionPoint: undefined` la sostituzione
// non avveniva: `self.__WB_MANIFEST` restava tale, a runtime valeva undefined e
// non veniva precaricato nulla. Da lì discendeva anche il fatto che sw.js fosse
// identico a ogni build, quindi il browser non rilevava mai un aggiornamento e
// il prompt di ReloadPrompt non compariva.
precacheAndRoute(self.__WB_MANIFEST);

// Rimuove le precache lasciate da versioni precedenti di Workbox.
cleanupOutdatedCaches();

// SPA: ogni navigazione viene servita dall'app shell in precache, così i deep
// link (/pro, /loyalty) funzionano anche offline. Le chiamate API sono escluse.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//]
  })
);

// Con registerType: 'prompt' il nuovo service worker resta in waiting finché
// l'utente non conferma. ReloadPrompt chiama updateServiceWorker(true), che
// invia questo messaggio: senza il listener il pulsante "Aggiorna" non
// attiverebbe la nuova versione.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

clientsClaim();

// Listen for Push events
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'FrigoRadar';
      const options = {
        body: data.body || 'Nuova notifica!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
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

/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// Cache dei dati Supabase: va svuotata al logout (stesso nome in authStore.signOut)
const DATA_CACHE = 'frigoradar-data';

// App shell: html, js, css e icone vengono scaricati all'installazione e serviti
// anche senza rete. L'elenco viene iniettato da VitePWA al build.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Le rotte interne (/pro, /loyalty, ...) offline devono comunque aprire la SPA
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//, /^\/\.well-known\//]
  })
);

// Dati Supabase (solo GET): prima la rete, altrimenti l'ultima copia vista.
// Cosi' il frigo si apre anche in metropolitana, con i prodotti dell'ultima sincronizzazione.
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/v1/'),
  new NetworkFirst({
    cacheName: DATA_CACHE,
    networkTimeoutSeconds: 8,
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 })]
  })
);

// Foto prodotto di OpenFoodFacts: cambiano di rado, la rete serve solo la prima volta
registerRoute(
  ({ url }) => url.hostname.endsWith('.openfoodfacts.org'),
  new CacheFirst({
    cacheName: 'frigoradar-product-images',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
);

// Font Inter da Google Fonts
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'frigoradar-fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 })]
  })
);

// Il pulsante "Aggiorna" di ReloadPrompt manda SKIP_WAITING: senza questo handler
// il nuovo SW restava in attesa e il pulsante non faceva niente.
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

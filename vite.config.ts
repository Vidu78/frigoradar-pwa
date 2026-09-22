import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // 'prompt' pretende una finestra di conferma che questa app non ha mai
      // mostrato: gli utenti restavano sulla versione vecchia per sempre.
      registerType: 'autoUpdate',
      injectManifest: {
        // Senza manifest iniettato il SW non precacheava nulla: senza rete la app
        // (e la TWA Android) mostrava la pagina di errore di Chrome.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
      },
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'robots.txt', 'sitemap.xml', 'icons.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'FrigoRadar',
        short_name: 'FrigoRadar',
        description: 'Gestisci il tuo frigorifero in modo intelligente.',
        theme_color: '#051A18',
        background_color: '#051A18',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});

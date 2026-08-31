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
      registerType: 'prompt',
      // Nessun injectManifest.injectionPoint: il default e `self.__WB_MANIFEST`,
      // ed e cio che rende sw.ts capace di precaricare l'app shell.
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'FrigoRadar',
        short_name: 'FrigoRadar',
        description: 'Gestisci il tuo frigorifero in modo intelligente.',
        lang: 'it',
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

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'FrigoRadar',
        short_name: 'FrigoRadar',
        description: 'Gestisci il tuo frigorifero in modo intelligente.',
        theme_color: '#051A18',
        background_color: '#051A18',
        display: 'standalone',
        icons: [
          {
            src: '/icon-512x512.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/icon-512x512.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ]
});

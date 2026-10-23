import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Les routes de la SPA (/sales, /stock...) servent toutes index.html, y compris hors ligne
        navigateFallback: '/index.html',
        // L'API ne doit jamais être servie par le service worker
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Elco Sage',
        short_name: 'Elco Sage',
        description: 'Application de gestion integrée',
        theme_color: '#080485',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/images/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/images/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Même alias que l'ancien frontend Inertia : les composants copiés restent inchangés
      '~': `${import.meta.dirname}/src`,
    },
  },
  server: { port: 5173 },
})

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
        // Les routes de la SPA servent toutes index.html, y compris hors ligne
        navigateFallback: '/index.html',
        // L'API ne doit jamais être servie par le service worker
        navigateFallbackDenylist: [/^\/api\//],
        // Pas de .woff : tous les navigateurs qui gèrent les service workers lisent le woff2
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
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
  build: {
    // Les polices Inter sont intégrées au CSS au lieu d'être 4 fichiers à part ; le reste suit la règle par défaut
    assetsInlineLimit: (filePath) =>
      filePath.includes('/@fontsource/inter/') && filePath.endsWith('.woff2') ? true : undefined,
    rollupOptions: {
      output: {
        // Les librairies chargées au démarrage ont leur propre chunk : leur nom ne change pas
        // d'un déploiement à l'autre, donc la mise à jour ne retélécharge que le code de l'app.
        // Les autres (react-pdf, recharts...) restent avec les modules lazy qui les utilisent.
        manualChunks: (id) => {
          if (!id.includes('/node_modules/')) return undefined

          if (
            /\/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)
          ) {
            return 'react-vendor'
          }
          if (id.includes('/node_modules/@tanstack/') || id.includes('/node_modules/idb/')) {
            return 'query-vendor'
          }
          if (
            /\/node_modules\/(@base-ui|@floating-ui|lucide-react|framer-motion|motion-dom|motion-utils|sonner)\//.test(
              id
            )
          ) {
            return 'ui-vendor'
          }
          return undefined
        },
      },
    },
  },
  server: { port: 5173 },
})

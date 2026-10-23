import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Meme alias que l'ancien frontend Inertia : les composants copies restent inchanges.
      '~': `${import.meta.dirname}/src`,
    },
  },
  server: { port: 5173 },
})

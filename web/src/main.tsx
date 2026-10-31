// Seul le sous-ensemble latin : il couvre le français (é, ç, œ, €) sans embarquer cyrillique, grec et vietnamien
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './css/app.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from '~/App'
import { loadOutbox } from '~/lib/offline/outbox'

// Le service worker garde l'application ouvrable sans réseau ; la file d'attente est rechargée depuis IndexedDB.
registerSW({ immediate: true })
void loadOutbox()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

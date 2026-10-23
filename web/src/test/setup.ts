import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, vi } from 'vitest'
import { resetDbConnection } from '~/lib/offline/db'
import { loadOutbox } from '~/lib/offline/outbox'

// Chaque test repart d'une base IndexedDB vide et d'un navigateur "en ligne"
beforeEach(async () => {
  // Nouvelle base vide, et connexion rouverte sur celle-ci
  globalThis.indexedDB = new IDBFactory()
  resetDbConnection()
  // Le navigateur de test se déclare connecté
  vi.stubGlobal('navigator', { onLine: true })
  // La file en mémoire est resynchronisée avec la base vide
  await loadOutbox()
})

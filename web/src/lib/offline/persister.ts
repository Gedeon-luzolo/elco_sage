import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { getDb } from '~/lib/offline/db'

// Clé sous laquelle le cache de lecture est stocké dans IndexedDB.
const CACHE_KEY = 'query-cache'

// Persiste le cache de lecture TanStack Query dans IndexedDB.
export const idbPersister: Persister = {
  // Sauvegarde du cache à chaque changement
  persistClient: async (client: PersistedClient) => {
    await (await getDb()).put('kv', client, CACHE_KEY)
  },
  // Restauration du cache au démarrage
  restoreClient: async () =>
    (await (await getDb()).get('kv', CACHE_KEY)) as PersistedClient | undefined,
  // Suppression du cache (déconnexion)
  removeClient: async () => {
    await (await getDb()).delete('kv', CACHE_KEY)
  },
}

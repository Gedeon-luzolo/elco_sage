import { QueryClient } from '@tanstack/react-query'
import { OFFLINE_CACHE_MAX_AGE_MS } from '~/lib/offline/config'
import { STALE_TIME } from '~/lib/react-query/cache_ttl'

// Client global pour les requêtes serveur.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      // Défaut des lectures ; les données qui changent depuis un autre poste (stock) le surchargent
      staleTime: STALE_TIME.MINUTES_5,
      // Doit couvrir la durée de persistance, sinon le cache restauré serait purgé aussitôt
      gcTime: OFFLINE_CACHE_MAX_AGE_MS,
      // Tente le réseau mais ne reste pas bloqué en attente quand il est coupé
      networkMode: 'offlineFirst',
    },
    // Les écritures hors ligne passent par la file d'attente : la mutation doit s'exécuter
    // et échouer (statut 0) plutôt que de rester en pause
    mutations: { networkMode: 'always' },
  },
})

// Invalide les requêtes dont la clé (premier élément) commence par un préfixe.
export const invalidateQueriesByPrefix = (prefixes: string | string[]) => {
  const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes]

  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0]

      return typeof key === 'string' && prefixList.some((prefix) => key.startsWith(prefix))
    },
  })
}

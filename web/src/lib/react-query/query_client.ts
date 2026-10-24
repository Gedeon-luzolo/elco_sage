import { QueryClient } from '@tanstack/react-query'
import { OFFLINE_CACHE_MAX_AGE_MS } from '~/lib/offline/config'

// Client global pour les requêtes serveur.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5,
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

// Données qui changent rarement : elles restent fraîches plus longtemps que les 5 minutes par défaut.
// Chaque écriture concernée vide déjà ces lectures (invalidateQueries), donc la durée ne retarde
// que les changements faits depuis un autre appareil, et un rechargement de la page les relit toujours.
const ONE_DAY_MS = 1000 * 60 * 60 * 24

const LONG_STALE_TIME_BY_KEY: Record<string, number> = {
  '/product-services/active-for-sale': ONE_DAY_MS,
  '/product-services': ONE_DAY_MS,
  '/product-categories': ONE_DAY_MS,
  '/customers/active-for-sale': ONE_DAY_MS,
  '/operators': ONE_DAY_MS,
}

Object.entries(LONG_STALE_TIME_BY_KEY).forEach(([key, staleTime]) => {
  queryClient.setQueryDefaults([key], { staleTime })
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

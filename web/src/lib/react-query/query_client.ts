import { QueryClient } from '@tanstack/react-query'

/** Client global pour les requetes serveur. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
    },
  },
})

/** Invalide les requetes dont la cle (premier element) commence par un prefixe. */
export const invalidateQueriesByPrefix = (prefixes: string | string[]) => {
  const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes]

  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0]

      return typeof key === 'string' && prefixList.some((prefix) => key.startsWith(prefix))
    },
  })
}

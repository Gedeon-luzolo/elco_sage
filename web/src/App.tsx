import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '~/context/auth_context'
import { OFFLINE_CACHE_MAX_AGE_MS, OFFLINE_QUERY_PREFIXES } from '~/lib/offline/config'
import { idbPersister } from '~/lib/offline/persister'
import { queryClient } from '~/lib/react-query/query_client'
import { AppRoutes } from '~/routes/routes'

// Seules les lectures utiles hors ligne sont conservées d'une session à l'autre.
const persistOptions = {
  persister: idbPersister,
  maxAge: OFFLINE_CACHE_MAX_AGE_MS,
  // À changer quand la forme des données en cache évolue : l'ancien cache est alors ignoré
  buster: 'v1',
  // Seules les requêtes réussies et utiles hors ligne sont sauvegardées
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { state: { status: string }; queryKey: readonly unknown[] }) =>
      query.state.status === 'success' &&
      OFFLINE_QUERY_PREFIXES.some((prefix) => String(query.queryKey[0]).startsWith(prefix)),
  },
}

// Racine de l'application : cache persistant, routeur, session et notifications.
export function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  )
}

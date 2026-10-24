import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/auth/useAuth'
import { useCurrentCashSession } from '~/hooks/sales/useCashSession'
import { useOnlineStatus } from '~/hooks/useOnlineStatus'
import { api } from '~/lib/api/fetch'
import { refreshNumbering } from '~/lib/offline/numbering'

type Params = Record<string, string | number | undefined>

// Charge en avance les données du module Ventes pour qu'elles soient en cache si le réseau se coupe.
// Chaque lecture reprend la clé et les paramètres de la page qui l'affiche : la page trouve alors
// sa donnée dans le cache au lieu de la relire. Une donnée encore fraîche n'est pas relue.
export function usePrefetchSalesData() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const { data: session } = useCurrentCashSession()
  const sessionId = session?.id
  const openingDate = session?.openingDate

  useEffect(() => {
    // Sans utilisateur ou sans réseau, il n'y a rien à charger
    if (!user || !isOnline) return

    // Liste simple, ou lecture avec paramètres (clé [endpoint] ou [endpoint, params])
    const prefetch = (endpoint: string, params?: Params) =>
      queryClient
        .query({
          queryKey: params ? [endpoint, params] : [endpoint],
          queryFn: () => api.get(endpoint, params ? { params } : undefined),
        })
        // Un échec n'a pas à bloquer la page : elle relira sa donnée elle-même
        .catch(() => undefined)

    // Données de l'écran de vente
    void prefetch('/operators')
    void prefetch('/customers/active-for-sale')
    void prefetch('/exchange-rates', { limit: 1 })

    // Historique, dettes et recouvrements avec leurs filtres par défaut
    void prefetch('/sales', { status: 'ALL' })
    void prefetch('/debts', {})
    void prefetch('/recoveries', {})

    // Ces données dépendent de la session de caisse ouverte
    if (sessionId) {
      // Plages de numéros d'addition gardées en réserve pour pouvoir vendre si le réseau se coupe
      void refreshNumbering(sessionId).catch(() => undefined)

      void prefetch('/product-services/active-for-sale', { date: openingDate ?? undefined })

      // Rapport de la session (résumé de la page Ventes), lu par id
      void queryClient
        .query({
          queryKey: ['/cash-sessions', sessionId],
          queryFn: () => api.get(`/cash-sessions/${sessionId}`),
        })
        .catch(() => undefined)
    }
  }, [queryClient, user, isOnline, sessionId, openingDate])
}

import { useCrud } from '~/hooks/common/useCrud'
import type { ExchangeRateDTO } from '~/types/dto'

// Taux courant : la ligne la plus récente de l'historique.
export function useCurrentExchangeRate(enabled = true) {
  // Une seule ligne suffit : l'historique est trié du plus récent au plus ancien
  const query = useCrud<ExchangeRateDTO>({ endpoint: '/exchange-rates' }).useListWithParams(
    { limit: 1 },
    enabled
  )

  return { ...query, data: query.data?.[0] }
}

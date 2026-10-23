import type { ExchangeRateDTO } from '~/types/dto'
import { useCrud } from '~/hooks/common/useCrud'

/** Taux courant : la ligne la plus recente de l'historique. */
export function useCurrentExchangeRate(enabled = true) {
  const query = useCrud<ExchangeRateDTO>({ endpoint: '/exchange-rates' }).useListWithParams(
    { limit: 1 },
    enabled
  )

  return { ...query, data: query.data?.[0] }
}

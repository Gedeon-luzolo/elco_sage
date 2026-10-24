import { useCrud } from '~/hooks/common/useCrud'
import type { CashSessionItem } from '~/types/cash_session_types'

const CASH_SESSIONS_ENDPOINT = '/cash-sessions'

// Session de caisse ouverte de l'utilisateur (null quand aucune n'est ouverte).
export function useCurrentCashSession(enabled = true) {
  return useCrud<CashSessionItem>({ endpoint: CASH_SESSIONS_ENDPOINT }).useGet('current', enabled)
}

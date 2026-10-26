import type { UserSummaryDTO } from '~/types/dto'
import type { SaleItemRow } from '~/types/sale_types'

export type MoneyMap = Record<string, number>

// Session de caisse telle que renvoyée par l'API.
// Les montants sont vides tant qu'elle est ouverte ; à la clôture, seules les devises comptées figurent.
export type CashSessionItem = {
  id: string
  openedById: string
  closedById: string | null
  status: string
  openedAt: string
  closedAt: string | null
  systemAmounts: MoneyMap | null
  closingAmounts: MoneyMap | null
  differenceAmounts: MoneyMap | null
  openedBy: UserSummaryDTO | null
  closedBy: UserSummaryDTO | null
}

// Type pour les totaux d'un rapport de ventes, regroupés par devise.
export type SaleReportTotals = {
  theoreticalAmounts: MoneyMap
  discountAmounts: MoneyMap
  cashAmounts: MoneyMap
  debtAmounts: MoneyMap
  realAmounts: MoneyMap
  recoveryAmounts: MoneyMap
  collectionAmounts: MoneyMap
}

// Props de la page de détail d'une session de caisse.
export interface CashSessionDetailPageProps {
  session: CashSessionItem
  sales: SaleItemRow[]
  totals: SaleReportTotals
}

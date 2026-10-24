import type { JSONDataTypes } from '~/types/json'
import type { SaleItemRow } from '~/types/sale_types'

export type MoneyMap = Record<string, number>

// Forme exposée au frontend pour la session de caisse courante.
export type CashSessionItem = Record<string, JSONDataTypes> & {
  id: string
  openedById: string
  closedById: string | null
  status: string
  openedAt: string | null
  openingDate: string | null
  openingTime: string | null
  closedAt: string | null
  closingDate: string | null
  closingTime: string | null
  systemAmounts: MoneyMap
  closingAmounts: MoneyMap | null
  differenceAmounts: MoneyMap | null
  openedByName: string | null
  closedByName: string | null
}

// Type pour les totaux d'un rapport de ventes, regroupés par devise.
export type SaleReportTotals = Record<string, JSONDataTypes> & {
  theoreticalAmounts: MoneyMap
  discountAmounts: MoneyMap
  cashAmounts: MoneyMap
  debtAmounts: MoneyMap
  realAmounts: MoneyMap
  recoveryAmounts: MoneyMap
  collectionAmounts: MoneyMap
}

// Props de la page de détail d'une session de caisse.
export interface CashSessionDetailPageProps extends Record<string, JSONDataTypes> {
  session: CashSessionItem
  sales: SaleItemRow[]
  totals: SaleReportTotals
}

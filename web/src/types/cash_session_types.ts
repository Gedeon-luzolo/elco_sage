import type { JSONDataTypes } from '~/types/json'
import type { CustomerDTO } from '~/types/dto'
import type { ProductServiceDTO } from '~/types/dto'
import type { SaleItemRow } from '~/types/sale_types'
import type { UserListItem } from '~/types/user_types'

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

// Props de la page d'ouverture de caisse.
export interface CashSessionOpeningPageProps extends Record<string, JSONDataTypes> {
  currentCashSession: CashSessionItem | null
}

export interface CashSessionsPageProps extends Record<string, JSONDataTypes> {
  sessions: CashSessionItem[]
  filters: {
    startDate: string | null
    endDate: string | null
  }
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

// Props de la page de navigation du module vente.
export interface SalesPageProps extends Record<string, JSONDataTypes> {
  currentCashSession: CashSessionItem | null
  sessionTotals: SaleReportTotals | null
}

// Props du formulaire de création de vente.
export interface SaleCreatePageProps extends Record<string, JSONDataTypes> {
  currentCashSession: CashSessionItem | null
  saleServices: Array<Record<string, JSONDataTypes> & ProductServiceDTO>
  operators: Array<Record<string, JSONDataTypes> & UserListItem>
  customers: Array<Record<string, JSONDataTypes> & CustomerDTO>
  printSale: SaleItemRow | null
}

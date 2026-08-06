import type { JSONDataTypes } from '@adonisjs/core/types/transformers'
import type { CustomerDTO } from '#transformers/customer_transformer'
import type { ProductServiceDTO } from '#transformers/product_service_transformer'
import type { SaleItemRow } from '~/types/sale_types'
import type { UserListItem } from '~/types/user_types'

export type MoneyMap = Record<string, number>

// Forme exposee au frontend pour la session de caisse courante.
export type CashSessionItem = Record<string, JSONDataTypes> & {
  id: string
  userId: string
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
}

// Props de la page d'ouverture de caisse.
export interface CashSessionOpeningPageProps extends Record<string, JSONDataTypes> {
  currentCashSession: CashSessionItem | null
}

// Props de la premiere page du module vente.
export interface SalesPageProps extends Record<string, JSONDataTypes> {
  currentCashSession: CashSessionItem | null
  saleServices: Array<Record<string, JSONDataTypes> & ProductServiceDTO>
  operators: Array<Record<string, JSONDataTypes> & UserListItem>
  customers: Array<Record<string, JSONDataTypes> & CustomerDTO>
  sales: SaleItemRow[]
}

// Props du formulaire de creation de vente.
export interface SaleCreatePageProps extends Record<string, JSONDataTypes> {
  currentCashSession: CashSessionItem | null
  saleServices: Array<Record<string, JSONDataTypes> & ProductServiceDTO>
  operators: Array<Record<string, JSONDataTypes> & UserListItem>
  customers: Array<Record<string, JSONDataTypes> & CustomerDTO>
}

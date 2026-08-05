import type { JSONDataTypes } from '@adonisjs/core/types/transformers'

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
  openingAmount: number
  openingCurrency: string
  closingAmount: number | null
  closingCurrency: string | null
}

// Props de la page d'ouverture de caisse.
export interface CashSessionOpeningPageProps extends Record<string, JSONDataTypes> {
  currentCashSession: CashSessionItem | null
}

// Props de la premiere page du module vente.
export interface SalesPageProps extends Record<string, JSONDataTypes> {
  currentCashSession: CashSessionItem | null
}

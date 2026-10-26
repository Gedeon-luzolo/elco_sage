import type { Currency } from '#types/currency'
import type { SalePaymentType } from '#models/sale'

export interface CreateSaleItemInput {
  productServiceId: string
  quantity: number
}

export interface PreparedSaleItemInput {
  productServiceId: string
  quantity: number
  currency: Currency
  unitPrice: number
  totalPrice: number
}

export interface PreparedSaleItemsResult {
  items: PreparedSaleItemInput[]
  theoreticalAmount: number
}

export interface CreateSaleInput {
  // Identifiant généré par le client hors ligne : sert à rendre la création idempotente.
  id?: string
  // Numéro issu de la plage réservée à la caisse (vente hors ligne).
  additionNumber?: string
  cashSessionId?: string
  customerId?: string | null
  operatorId: string
  paymentType: SalePaymentType
  saleDate?: string | Date | null
  currency: Currency
  discountAmount?: number | null
  items: CreateSaleItemInput[]
}

export interface CreateSaleRecoveryInput {
  // Identifiant généré par le client hors ligne : sert à rendre la création idempotente.
  id?: string
  amount: number
  currency: Currency
  recoveredAt?: string | Date | null
}

export interface FindSalesHistoryParams {
  offset?: number
  limit?: number
  facturationDate?: string
  additionNumber?: string
  status?: string
}

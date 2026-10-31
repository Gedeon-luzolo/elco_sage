import type { UserSummaryDTO } from '~/types/dto'

export type SaleItem = {
  id: string
  saleId: string
  productServiceId: string
  quantity: number
  currency: string
  unitPrice: number
  totalPrice: number
  productService: { id: string; name: string } | null
}

export type SaleRecovery = {
  id: string
  saleId: string
  cashSessionId: string | null
  receivedById: string
  amount: number
  currency: string
  paymentMethod: string
  paymentReference: string | null
  recoveredAt: string
  receivedBy: UserSummaryDTO | null
}

export type SaleItemRow = {
  id: string
  cashSessionId: string
  customerId: string | null
  operatorId: string
  sellerId: string
  paymentType: string
  paymentMethod: string | null
  paymentReference: string | null
  invoiceNumber: number | null
  offlineReference: string | null
  saleDate: string
  currency: string
  theoreticalAmount: number
  discountAmount: number
  totalAmount: number
  status: string
  cashSession: { id: string; status: string } | null
  customer: { id: string; fullName: string } | null
  operator: UserSummaryDTO | null
  seller: UserSummaryDTO | null
  items: SaleItem[]
  recoveries: SaleRecovery[]
}

// Filtres de l'historique des ventes.
export type SalesHistoryFilters = {
  facturationDate: string | null
  search: string | null
  status: string
}

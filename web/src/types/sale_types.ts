import type { CustomerDTO } from '~/types/dto'
import type { ProductServiceDTO } from '~/types/dto'
import type { JSONDataTypes } from '~/types/json'

export type SaleItem = Record<string, JSONDataTypes> & {
  id: string
  saleId: string
  orderNumber: string
  productServiceId: string
  quantity: number
  currency: string
  unitPrice: number
  totalPrice: number
  productService: (Record<string, JSONDataTypes> & ProductServiceDTO) | null
}

export type SaleRecovery = Record<string, JSONDataTypes> & {
  id: string
  saleId: string
  cashSessionId: string | null
  receivedById: string
  amount: number
  currency: string
  recoveredAt: string | null
  receivedByName: string | null
}

export type SaleItemRow = Record<string, JSONDataTypes> & {
  id: string
  cashSessionId: string
  customerId: string | null
  operatorId: string
  sellerId: string
  paymentType: string
  additionNumber: string
  saleDate: string | null
  currency: string
  theoreticalAmount: number
  discountAmount: number
  totalAmount: number
  status: string
  cashSessionStatus: string | null
  customer: (Record<string, JSONDataTypes> & CustomerDTO) | null
  operatorName: string | null
  sellerName: string | null
  items: SaleItem[]
  recoveries: SaleRecovery[]
}

// Filtres appliqués par le controller Inertia sur l'historique des ventes.
export type SalesHistoryFilters = Record<string, JSONDataTypes> & {
  facturationDate: string | null
  additionNumber: string | null
  status: string
}

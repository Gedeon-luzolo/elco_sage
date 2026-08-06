import type { CustomerDTO } from '#transformers/customer_transformer'
import type { ProductServiceDTO } from '#transformers/product_service_transformer'
import type { JSONDataTypes } from '@adonisjs/core/types/transformers'

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
  customer: (Record<string, JSONDataTypes> & CustomerDTO) | null
  operatorName: string | null
  sellerName: string | null
  items: SaleItem[]
  recoveries: SaleRecovery[]
}

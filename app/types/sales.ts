import type { Currency } from '#types/currency'
import type { SalePaymentType } from '#models/sale'
import type ProductService from '#models/product_service'

export interface CreateSaleItemInput {
  orderNumber: string
  productServiceId: string
  quantity: number
}

export interface PreparedSaleItemInput {
  orderNumber: string
  productServiceId: string
  stockProduct: ProductService
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
  amount: number
  currency: Currency
  recoveredAt?: string | Date | null
}

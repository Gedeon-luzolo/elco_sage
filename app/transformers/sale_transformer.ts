import type Sale from '#models/sale'
import type { CustomerDTO } from '#transformers/customer_transformer'
import CustomerTransformer from '#transformers/customer_transformer'
import type { SaleItemDTO } from '#transformers/sale_item_transformer'
import SaleItemTransformer from '#transformers/sale_item_transformer'
import type { SaleRecoveryDTO } from '#transformers/sale_recovery_transformer'
import SaleRecoveryTransformer from '#transformers/sale_recovery_transformer'

export interface SaleDTO {
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
  customer: CustomerDTO | null
  operatorName: string | null
  sellerName: string | null
  items: SaleItemDTO[]
  recoveries: SaleRecoveryDTO[]
}

export default class SaleTransformer {
  /**
   * Transforme une vente avec ses relations utiles.
   */
  public static transformSingle(sale: Sale): SaleDTO {
    return {
      id: sale.id,
      cashSessionId: sale.cashSessionId,
      customerId: sale.customerId,
      operatorId: sale.operatorId,
      sellerId: sale.sellerId,
      paymentType: sale.paymentType,
      additionNumber: sale.additionNumber,
      saleDate: sale.saleDate?.toISO() ?? null,
      currency: sale.currency,
      theoreticalAmount: sale.theoreticalAmount,
      discountAmount: sale.discountAmount,
      totalAmount: sale.totalAmount,
      status: sale.status,
      customer: sale.customer ? CustomerTransformer.transformSingle(sale.customer) : null,
      operatorName: sale.operator?.fullName ?? sale.operator?.email ?? null,
      sellerName: sale.seller?.fullName ?? sale.seller?.email ?? null,
      items: sale.items ? SaleItemTransformer.transform(sale.items) : [],
      recoveries: sale.recoveries ? SaleRecoveryTransformer.transform(sale.recoveries) : [],
    }
  }

  /**
   * Transforme une liste de ventes.
   */
  public static transform(sales: Sale[]): SaleDTO[] {
    return sales.map((sale) => this.transformSingle(sale))
  }
}

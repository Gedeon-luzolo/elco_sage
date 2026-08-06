import type SaleItem from '#models/sale_item'
import type { ProductServiceDTO } from '#transformers/product_service_transformer'
import ProductServiceTransformer from '#transformers/product_service_transformer'

export interface SaleItemDTO {
  id: string
  saleId: string
  orderNumber: string
  productServiceId: string
  quantity: number
  currency: string
  unitPrice: number
  totalPrice: number
  productService: ProductServiceDTO | null
}

export default class SaleItemTransformer {
  /**
   * Transforme une ligne de vente.
   */
  public static transformSingle(item: SaleItem): SaleItemDTO {
    return {
      id: item.id,
      saleId: item.saleId,
      orderNumber: item.orderNumber,
      productServiceId: item.productServiceId,
      quantity: item.quantity,
      currency: item.currency,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      productService: item.productService
        ? ProductServiceTransformer.transformSingle(item.productService)
        : null,
    }
  }

  /**
   * Transforme une liste de lignes de vente.
   */
  public static transform(items: SaleItem[]): SaleItemDTO[] {
    return items.map((item) => this.transformSingle(item))
  }
}

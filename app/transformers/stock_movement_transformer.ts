import type StockMovement from '#models/stock_movement'

export interface StockMovementDTO {
  id: string | number // UUID réel ou -1 pour les produits sans mouvement
  productId: string
  productName: string
  productBaseUnit: string
  productPackagingUnit: string | null
  productPackagingCapacity: number | null
  categoryName: string | null
  date: string
  initialStock: number | null
  entries: number | null
  availableStock: number | null
  outputs: number | null
  losses: number | null
  theoreticalStock: number | null
  physicalStock: number | null
  variance: number | null
  isPhysicalStockValidated: boolean
}

export default class StockMovementTransformer {
  /**
   * Transforme un mouvement de stock pour le frontend.
   */
  public static transformSingle(item: StockMovement): StockMovementDTO {
    return {
      id: item.id,
      productId: item.productId,
      productName: item.product?.name ?? '',
      productBaseUnit: item.product?.baseUnit ?? '',
      productPackagingUnit: item.product?.packagingUnit ?? null,
      productPackagingCapacity: item.product?.packagingCapacity ?? null,
      categoryName: item.product?.category?.name ?? null,
      date: item.date.toISODate() ?? '',
      initialStock: item.initialStock,
      entries: item.entries,
      availableStock: item.availableStock,
      outputs: item.outputs,
      losses: item.losses,
      theoreticalStock: item.theoreticalStock,
      physicalStock: item.physicalStock,
      variance: item.variance,
      isPhysicalStockValidated: item.isPhysicalStockValidated,
    }
  }

  /**
   * Transforme une liste de mouvements de stock.
   */
  public static transform(items: StockMovement[]): StockMovementDTO[] {
    return items.map((item) => this.transformSingle(item))
  }
}

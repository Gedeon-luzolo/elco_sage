import type ProductService from '#models/product_service'

type ProductServiceWithSaleStock = ProductService & {
  saleStockSnapshot?: {
    availableStock: number
    canSell: boolean
    blockingReason: string | null
  } | null
}

export interface ProductServiceDTO {
  id: string
  type: string
  name: string
  categoryId: string | null
  categoryName: string | null
  stockProductId: string | null
  stockProductName: string | null
  stockProductBaseUnit: string | null
  saleAvailableStock: number | null
  canSell: boolean
  stockBlockingReason: string | null
  isActive: boolean
  baseUnit: string | null
  packagingUnit: string | null
  packagingCapacity: number | null
  priceUsd: number
  priceCdf: number
  createdAt: string
  updatedAt: string | null
}

export default class ProductServiceTransformer {
  public static transformSingle(item: ProductService): ProductServiceDTO {
    const saleStockSnapshot = (item as ProductServiceWithSaleStock).saleStockSnapshot ?? null

    return {
      id: item.id,
      type: item.type,
      name: item.name,
      categoryId: item.categoryId,
      categoryName: item.category?.name ?? null,
      stockProductId: item.stockProductId,
      stockProductName: item.stockProduct?.name ?? null,
      stockProductBaseUnit: item.stockProduct?.baseUnit ?? null,
      saleAvailableStock: saleStockSnapshot?.availableStock ?? null,
      canSell: saleStockSnapshot?.canSell ?? true,
      stockBlockingReason: saleStockSnapshot?.blockingReason ?? null,
      isActive: item.isActive,
      baseUnit: item.baseUnit,
      packagingUnit: item.packagingUnit,
      packagingCapacity: item.packagingCapacity,
      priceUsd: Number(item.priceUsd),
      priceCdf: Number(item.priceCdf),
      createdAt: item.createdAt.toISO() ?? item.createdAt.toString(),
      updatedAt: item.updatedAt ? (item.updatedAt.toISO() ?? item.updatedAt.toString()) : null,
    }
  }

  public static transform(items: ProductService[]): ProductServiceDTO[] {
    return items.map((item) => this.transformSingle(item))
  }
}

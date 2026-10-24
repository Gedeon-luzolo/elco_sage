import type ProductService from '#models/product_service'

export interface ProductServiceDTO {
  id: string
  type: string
  name: string
  categoryId: string | null
  categoryName: string | null
  isActive: boolean
  baseUnit: string | null
  packagingUnit: string | null
  packagingCapacity: number | null
  priceUsd: number
  priceCdf: number
  materialCostUsd: number
  materialCostCdf: number
  createdAt: string
  updatedAt: string | null
}

export default class ProductServiceTransformer {
  public static transformSingle(item: ProductService): ProductServiceDTO {
    return {
      id: item.id,
      type: item.type,
      name: item.name,
      categoryId: item.categoryId,
      categoryName: item.category?.name ?? null,
      isActive: item.isActive,
      baseUnit: item.baseUnit,
      packagingUnit: item.packagingUnit,
      packagingCapacity: item.packagingCapacity,
      priceUsd: Number(item.priceUsd),
      priceCdf: Number(item.priceCdf),
      materialCostUsd: Number(item.materialCostUsd),
      materialCostCdf: Number(item.materialCostCdf),
      createdAt: item.createdAt.toISO() ?? item.createdAt.toString(),
      updatedAt: item.updatedAt ? (item.updatedAt.toISO() ?? item.updatedAt.toString()) : null,
    }
  }

  public static transform(items: ProductService[]): ProductServiceDTO[] {
    return items.map((item) => this.transformSingle(item))
  }
}

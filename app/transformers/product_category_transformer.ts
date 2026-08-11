import type ProductCategory from '#models/product_category'

export interface ProductCategoryDTO {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export default class ProductCategoryTransformer {
  public static transformSingle(category: ProductCategory): ProductCategoryDTO {
    return {
      id: category.id,
      name: category.name,
      isActive: category.isActive,
      createdAt: category.createdAt.toISO() ?? category.createdAt.toString(),
      updatedAt: category.updatedAt
        ? (category.updatedAt.toISO() ?? category.updatedAt.toString())
        : null,
    }
  }

  public static transform(categories: ProductCategory[]): ProductCategoryDTO[] {
    return categories.map((cat) => this.transformSingle(cat))
  }
}

import type { ProductCategoryDTO } from '#transformers/product_category_transformer'

export type ProductCategoryItem = ProductCategoryDTO

export interface ProductCategoryStats {
  total: number
  activeCount: number
  inactiveCount: number
}

export interface ProductCategoriesPageProps {
  categories: ProductCategoryItem[]
  stats: ProductCategoryStats
}

export interface ProductCategoryFormData {
  name: string
  description?: string
  isActive?: boolean
}

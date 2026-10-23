import type { ProductCategoryDTO } from '~/types/dto'

export type ProductCategoryItem = ProductCategoryDTO

export interface ProductCategoryStats {
  total: number
  activeCount: number
  inactiveCount: number
}

export type ProductCategoriesPageProps = {
  categories: ProductCategoryItem[]
  stats: ProductCategoryStats
}

export interface ProductCategoryFormData {
  name: string
  isActive?: boolean
}

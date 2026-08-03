import type { ProductServiceDTO } from '#transformers/product_service_transformer'
import type { ProductCategoryDTO } from '#transformers/product_category_transformer'

export type ProductServiceItem = ProductServiceDTO

export interface ProductServiceStats {
  total: number
  activeCount: number
  inactiveCount: number
  productCount: number
  serviceCount: number
}

export interface ProductServicesPageProps {
  products: ProductServiceItem[]
  services: ProductServiceItem[]
  stats: ProductServiceStats
  categories: ProductCategoryDTO[]
}

import type { ProductServiceDTO } from '~/types/dto'
import type { ProductCategoryDTO } from '~/types/dto'

export type ProductServiceItem = ProductServiceDTO

export interface ProductServiceStats {
  total: number
  activeCount: number
  inactiveCount: number
  productCount: number
  serviceCount: number
}

export type ProductServicesPageProps = {
  products: ProductServiceItem[]
  services: ProductServiceItem[]
  stats: ProductServiceStats
  categories: ProductCategoryDTO[]
}

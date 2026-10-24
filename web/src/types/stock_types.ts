export type StockUnit = 'base' | 'packaging'

export type StockMovementItem = {
  id: string | number // UUID réel ou -1 pour produits sans mouvement
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
  observation: string | null
  isPhysicalStockValidated: boolean
}

export type StockUnit = 'base' | 'packaging'

// Ligne du stock journalier : id vaut -1 pour un produit sans mouvement à cette date.
export interface StockMovementDTO {
  id: string | number
  productId: string
  productName: string
  productBaseUnit: string
  productPackagingUnit: string | null
  productPackagingCapacity: number | null
  unitCostCdf: number
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

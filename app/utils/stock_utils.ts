import type ProductService from '#models/product_service'
import type { StockUnit } from '#types/stock'

/**
 * Convertit une quantité en unité de base selon l'unité fournie
 * Ex: 10 rames → 5000 feuilles (si packagingCapacity = 500)
 */
export function convertToBaseUnit(
  quantity: number,
  unit: StockUnit,
  product: ProductService
): number {
  if (unit === 'base') {
    return quantity
  }

  // Conversion du conditionnement vers l'unité de base
  const capacity = product.packagingCapacity ?? 1
  return quantity * capacity
}

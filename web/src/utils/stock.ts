import type { StockMovementItem } from '~/types/stock_types'
import type { StockUnit } from '~/types/stock_types'

/**
 * Formate une quantité pour l'affichage.
 * Retourne '-' si la quantité est null.
 */
export function formatQuantity(qty: number | null): string | number {
  return qty === null ? '-' : qty
}

/**
 * Formate une quantité avec son unité.
 */
export function formatQuantityWithUnit(qty: number | null, unit: string): string {
  if (qty === null) return '-'
  return `${qty} ${unit}${qty > 1 ? 's' : ''}`
}

/**
 * Calcule l'aperçu de conversion entre unités.
 */
export function getConversionPreview(
  quantity: string | number,
  selectedUnit: StockUnit,
  movement: StockMovementItem
): string | null {
  const qty = typeof quantity === 'string' ? Number(quantity) : quantity

  if (!qty || Number.isNaN(qty)) return null

  const hasPackaging = movement.productPackagingUnit && movement.productPackagingCapacity

  if (selectedUnit === 'base') {
    if (hasPackaging) {
      const packagingQty = qty / movement.productPackagingCapacity!
      return `~ ${packagingQty.toFixed(2)} ${movement.productPackagingUnit}${packagingQty > 1 ? 's' : ''}`
    }
    return null
  }

  if (!hasPackaging) return null
  const baseQty = qty * movement.productPackagingCapacity!
  return `= ${baseQty} ${movement.productBaseUnit}${baseQty > 1 ? 's' : ''}`
}

/**
 * Vérifie si un mouvement a un écart significatif.
 */
export function hasSignificantVariance(movement: StockMovementItem): boolean {
  return movement.variance !== null && Math.abs(movement.variance) > 0
}

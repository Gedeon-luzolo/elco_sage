import type { StockMovementItem } from '~/types/stock_types'
import type { StockUnit } from '~/types/stock_types'

/**
 * Formater une quantité pour l'affichage.
 * Retourne '—' si la quantité est null.
 */
export function formatQuantity(qty: number | null): string | number {
  return qty === null ? '—' : qty
}

/**
 * Formater une quantité avec son unité.
 */
export function formatQuantityWithUnit(qty: number | null, unit: string): string {
  if (qty === null) return '—'
  return `${qty} ${unit}${qty > 1 ? 's' : ''}`
}

/**
 * Calculer l'aperçu de conversion entre unités.
 * @param quantity - Quantité saisie
 * @param selectedUnit - Unité sélectionnée ('base' ou 'packaging')
 * @param movement - Informations du produit
 * @returns Texte de conversion ou null
 */
export function getConversionPreview(
  quantity: string | number,
  selectedUnit: StockUnit,
  movement: StockMovementItem
): string | null {
  const qty = typeof quantity === 'string' ? Number(quantity) : quantity

  if (!qty || isNaN(qty)) return null

  const hasPackaging = movement.productPackagingUnit && movement.productPackagingCapacity

  if (selectedUnit === 'base') {
    // Si saisie en unité de base, afficher conversion en conditionnement
    if (hasPackaging) {
      const packagingQty = qty / movement.productPackagingCapacity!
      return `≈ ${packagingQty.toFixed(2)} ${movement.productPackagingUnit}${packagingQty > 1 ? 's' : ''}`
    }
    return null
  } else {
    // Si saisie en conditionnement, afficher conversion en unité de base
    if (!hasPackaging) return null
    const baseQty = qty * movement.productPackagingCapacity!
    return `= ${baseQty} ${movement.productBaseUnit}${baseQty > 1 ? 's' : ''}`
  }
}

/**
 * Filtrer les mouvements de stock par nom de produit.
 */
export function filterStockMovements(
  items: StockMovementItem[],
  searchTerm: string
): StockMovementItem[] {
  if (!searchTerm.trim()) return items
  const search = searchTerm.toLowerCase()
  return items.filter((item) => item.productName.toLowerCase().includes(search))
}

/**
 * Vérifier si un mouvement a des données enregistrées.
 */
export function hasMovementData(movement: StockMovementItem): boolean {
  return movement.id !== -1
}

/**
 * Vérifier si un mouvement a un écart significatif.
 */
export function hasSignificantVariance(movement: StockMovementItem): boolean {
  return movement.variance !== null && Math.abs(movement.variance) > 0
}

/**
 * Obtenir la couleur de la bordure selon le statut du mouvement.
 */
export function getMovementBorderColor(movement: StockMovementItem): string {
  if (!hasMovementData(movement)) return 'border-t-gray-400'
  if (movement.isPhysicalStockValidated) return 'border-t-emerald-500'
  return 'border-t-amber-500'
}

import type ProductService from '#models/product_service'

/**
 * Convertit une quantité en unité de base selon l'unité fournie
 * Ex: 10 rames → 5000 feuilles (si packagingCapacity = 500)
 */
export function convertToBaseUnit(
  quantity: number,
  unit: 'base' | 'packaging',
  product: ProductService
): number {
  if (unit === 'base') {
    return quantity
  }

  // Conversion du conditionnement vers l'unité de base
  const capacity = product.packagingCapacity ?? 1
  return quantity * capacity
}

/**
 * Convertit une quantité de l'unité de base vers l'unité de conditionnement
 * Ex: 5000 feuilles → 10 rames (si packagingCapacity = 500)
 */
export function convertFromBaseUnit(
  quantity: number,
  product: ProductService
): {
  packaging: number
  base: number
} {
  const capacity = product.packagingCapacity ?? 1

  if (!capacity || capacity === 0) {
    return { packaging: 0, base: quantity }
  }

  const packaging = Math.floor(quantity / capacity)
  const base = quantity % capacity

  return { packaging, base }
}

/**
 * Formate l'affichage d'une quantité de manière intelligente
 * Ex: 5000 feuilles → "10 rames" ou "10 rames et 250 feuilles"
 */
export function formatQuantity(quantity: number, product: ProductService): string {
  // Si pas de conditionnement, afficher juste l'unité de base
  if (!product.packagingUnit || !product.packagingCapacity) {
    return `${quantity} ${product.baseUnit}${quantity > 1 ? 's' : ''}`
  }

  const converted = convertFromBaseUnit(quantity, product)

  if (converted.base === 0) {
    // Quantité exacte en conditionnement
    return `${converted.packaging} ${product.packagingUnit}${converted.packaging > 1 ? 's' : ''}`
  }

  if (converted.packaging === 0) {
    // Seulement des unités de base
    return `${converted.base} ${product.baseUnit}${converted.base > 1 ? 's' : ''}`
  }

  // Les deux
  return `${converted.packaging} ${product.packagingUnit}${converted.packaging > 1 ? 's' : ''} et ${converted.base} ${product.baseUnit}${converted.base > 1 ? 's' : ''}`
}

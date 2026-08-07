import type { StockUnit } from '~/types/stock_types'

interface ProductUnitSource {
  productBaseUnit: string
  productPackagingUnit: string | null
  productPackagingCapacity: number | null
}

export type ProductUnitOption = {
  label: string
  value: StockUnit
}

// Vérifie si un produit a un conditionnement défini.
export function hasProductPackaging(product: ProductUnitSource): boolean {
  return Boolean(product.productPackagingUnit && product.productPackagingCapacity)
}

// Retourne les unités disponibles pour la saisie du stock.
export function getProductUnitOptions(product: ProductUnitSource): ProductUnitOption[] {
  return [
    { label: product.productBaseUnit, value: 'base' },
    ...(hasProductPackaging(product)
      ? [{ label: product.productPackagingUnit as string, value: 'packaging' as const }]
      : []),
  ]
}

import type { ProductCategoryItem } from '~/types/product_category_types'
import type { StockUnit } from '~/types/stock_types'
import { matchesStatusFilter, type StatusFilter } from '~/utils/status.utils'

interface ProductUnitSource {
  productBaseUnit: string
  productPackagingUnit: string | null
  productPackagingCapacity: number | null
}

export type ProductUnitOption = {
  label: string
  value: StockUnit
}

// Fonction pour vérifier si un produit a un conditionnement défini.
export function hasProductPackaging(product: ProductUnitSource): boolean {
  return Boolean(product.productPackagingUnit && product.productPackagingCapacity)
}

// Fonction pour obtenir les options d'unité d'un produit, en incluant l'unité de conditionnement si elle est définie.
export function getProductUnitOptions(product: ProductUnitSource): ProductUnitOption[] {
  return [
    { label: product.productBaseUnit, value: 'base' },
    ...(hasProductPackaging(product)
      ? [{ label: product.productPackagingUnit as string, value: 'packaging' as const }]
      : []),
  ]
}

/**
 * Filtre la liste des catégories de produits selon la recherche textuelle et le statut d'activation.
 *
 * @param categories Liste complète des catégories
 * @param search Terme recherché dans le nom ou la description
 * @param statusFilter Filtre par statut (StatusFilter ou string)
 */
export function filterProductCategories(
  categories: ProductCategoryItem[],
  search: string,
  statusFilter: StatusFilter | 'all' | 'active' | 'inactive'
): ProductCategoryItem[] {
  // Convertit le terme de recherche en minuscules une seule fois.
  const query = search.trim().toLowerCase()

  return categories.filter((cat) => {
    // Vérifie la correspondance du nom ou de la description avec la recherche.
    const matchesSearch =
      query === '' ||
      cat.name.toLowerCase().includes(query) ||
      (cat.description && cat.description.toLowerCase().includes(query))

    // Utilise le helper centralisé pour la correspondance du statut.
    const matchesStatus = matchesStatusFilter(cat.isActive, statusFilter)

    return matchesSearch && matchesStatus
  })
}

import type { ProductCategoryItem } from '~/types/product_category_types'
import { matchesStatusFilter, type StatusFilter } from '~/utils/status.utils'

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

import { useEffect, useMemo, useState } from 'react'

interface UsePaginatedParams<T> {
  initialItems: T[]
  pageSize?: number
}

// Pagine en mémoire une liste déjà chargée.
export function usePaginated<T>({ initialItems, pageSize = 10 }: UsePaginatedParams<T>) {
  const [items, setItems] = useState(initialItems)
  const [currentPage, setCurrentPage] = useState(1)

  // Index de départ de la page courante dans la liste complète chargée en mémoire.
  const startIndex = (currentPage - 1) * pageSize

  // Index de fin de la page courante dans la liste complète chargée en mémoire.
  const endIndex = startIndex + pageSize

  // Nombre de pages disponibles avec les lignes déjà chargées en mémoire.
  const totalLoadedPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    setItems(initialItems)
    setCurrentPage(1)
  }, [initialItems])

  // Tranche réellement affichée dans le tableau pour la page courante.
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex)
  }, [endIndex, items, startIndex])

  // Remplace la liste chargée quand les filtres changent ou quand on relance une recherche.
  const reset = (nextItems: T[]) => {
    setItems(nextItems)
    setCurrentPage(1)
  }

  // Va directement à une page déjà disponible en mémoire.
  const goToPage = (page: number) => {
    setCurrentPage(Math.min(totalLoadedPages, Math.max(1, page)))
  }

  return {
    items,
    visibleItems,
    currentPage,
    totalLoadedPages,
    loadedItemsCount: items.length,
    reset,
    goToPage,
  }
}

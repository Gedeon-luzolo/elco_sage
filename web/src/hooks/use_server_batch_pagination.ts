import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { api } from '~/lib/api/fetch'
import type { ServerBatchResponse } from '~/types/pagination_types'

type BatchParams = Record<string, string | number | boolean | undefined>

interface UseServerBatchPaginationParams {
  endpoint: string
  params?: BatchParams
  itemsPerPage: number
  batchSize: number
}

// Pagine une liste serveur par lots : un lot alimente plusieurs pages affichées, et le lot
// suivant est demandé quand on dépasse sa dernière page. Pendant le chargement d'un lot,
// la page précédente reste affichée.
export function useServerBatchPagination<T>({
  endpoint,
  params = {},
  itemsPerPage,
  batchSize,
}: UseServerBatchPaginationParams) {
  const [currentPage, setCurrentPage] = useState(1)
  // Page dont les lignes sont réellement affichées (en retard sur currentPage pendant un chargement)
  const [displayedPage, setDisplayedPage] = useState(1)

  // Position du lot qui contient la page demandée dans la liste complète
  const offset = Math.floor(((currentPage - 1) * itemsPerPage) / batchSize) * batchSize

  // L'offset et la limite font partie de la clé : chaque lot est mis en cache à part
  const query = useQuery({
    queryKey: [endpoint, { ...params, offset, limit: batchSize }],
    queryFn: () =>
      api.get<ServerBatchResponse<T>>(endpoint, {
        params: { ...params, offset, limit: batchSize },
      }),
    placeholderData: keepPreviousData,
  })

  // Tant que le nouveau lot charge, les données sont celles du lot précédent : on garde sa page
  const isLoadingBatch = query.isPlaceholderData
  const shownPage = isLoadingBatch ? displayedPage : currentPage

  useEffect(() => {
    if (!isLoadingBatch) setDisplayedPage(currentPage)
  }, [currentPage, isLoadingBatch])

  const items = query.data?.items
  const totalItems = query.data?.pagination.totalItems ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // Les lignes de la page affichée, repérées par rapport au lot qui les contient
  const batchOffset = query.data?.pagination.offset ?? offset
  const startIndexInBatch = (shownPage - 1) * itemsPerPage - batchOffset
  const currentItems = items?.slice(startIndexInBatch, startIndexInBatch + itemsPerPage) ?? []

  // Un changement de filtres repart de la première page
  const filtersKey = JSON.stringify(params)
  const previousFiltersKey = useRef(filtersKey)
  useEffect(() => {
    if (previousFiltersKey.current === filtersKey) return

    previousFiltersKey.current = filtersKey
    setCurrentPage(1)
  }, [filtersKey])

  return {
    currentItems,
    currentPage,
    totalItems,
    totalPages,
    // Premier chargement, sans aucune donnée à afficher
    isLoading: query.isPending,
    // Un lot est en cours de chargement : la page affichée est encore l'ancienne
    isFetching: query.isFetching,
    goToPage: (page: number) => setCurrentPage(Math.min(totalPages, Math.max(1, page))),
  }
}

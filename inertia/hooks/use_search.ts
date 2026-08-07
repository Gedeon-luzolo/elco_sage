import { useMemo, useState } from 'react'

// Un champ de recherche peut être une clé directe de l'objet ou une fonction
// quand la valeur à filtrer est imbriquée/calculée.
type SearchField<T> = keyof T | ((item: T) => unknown)

interface UseSearchParams<T> {
  items: T[]
  fields: SearchField<T>[]
  // Valeur initiale utilisée lorsque le hook gère lui-même son état.
  initialSearch?: string
  // Couple optionnel pour utiliser le hook en mode contrôlé depuis la page.
  search?: string
  onSearchChange?: (value: string) => void
}

// Convertit toutes les valeurs filtrables en texte comparable.
// Les champs vides sont neutralisés pour éviter des null checks dans chaque page.
function normalizeSearchValue(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).toLowerCase()
}

// Lit la valeur à comparer, que le champ soit une propriété simple ou un accessor.
function getSearchValue<T>(item: T, field: SearchField<T>) {
  if (typeof field === 'function') {
    return field(item)
  }

  return item[field]
}

/**
 * Filtre localement une liste déjà chargée en mémoire.
 *
 * Le hook peut gérer son propre état de recherche ou recevoir un état contrôlé
 * pour partager le même terme entre plusieurs listes.
 */
export function useSearch<T>({
  items,
  fields,
  initialSearch = '',
  search: controlledSearch,
  onSearchChange,
}: UseSearchParams<T>) {
  // Mode non contrôlé par défaut; mode contrôlé si search/onSearchChange sont fournis.
  const [internalSearch, setInternalSearch] = useState(initialSearch)
  const search = controlledSearch ?? internalSearch
  const setSearch = onSearchChange ?? setInternalSearch

  // Le terme est normalisé une seule fois pour garder le filtre simple et stable.
  const query = search.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    if (!query) {
      return items
    }

    // Un item est conservé dès qu'un des champs déclarés contient le terme recherché.
    return items.filter((item) => {
      return fields.some((field) =>
        normalizeSearchValue(getSearchValue(item, field)).includes(query)
      )
    })
  }, [fields, items, query])

  const resetSearch = () => {
    setSearch('')
  }

  return {
    search,
    setSearch,
    query,
    filteredItems,
    hasSearch: query.length > 0,
    resetSearch,
  }
}

import { useCallback, useState } from 'react'
import { apiGet, type ApiGetOptions } from '~/lib/api_fetch'

// Hook GET générique: expose les données typées, l'état de chargement et un refetch manuel.
export function useApiGet<T>(endpoint: string, options: ApiGetOptions = {}) {
  const { params, signal } = options
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Le hook ne lance rien tout seul: le composant garde le contrôle via refetch().
  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextData = await apiGet<T>(endpoint, { params, signal })
      setData(nextData)

      return nextData
    } catch (fetchError) {
      // Normalise les erreurs inconnues pour garder une API simple côté UI.
      const nextError =
        fetchError instanceof Error ? fetchError : new Error('Impossible de charger les donnees.')

      setError(nextError)
      throw nextError
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, params, signal])

  return {
    data,
    error,
    isLoading,
    refetch,
  }
}

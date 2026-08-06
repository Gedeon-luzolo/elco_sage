export type QueryParams = Record<string, string | number | boolean | null | undefined>

export interface ApiGetOptions {
  params?: QueryParams
  signal?: AbortSignal
}

// Construit une URL GET relative pour rester compatible avec les routes locales Inertia/Adonis.
function buildApiUrl(endpoint: string, params?: QueryParams) {
  const url = new URL(endpoint, window.location.origin)

  // Les valeurs null/undefined sont ignorées pour éviter des query params inutiles.
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })
  // Construire l'URL relative pour rester compatible avec les routes locales Inertia/Adonis.
  return `${url.pathname}${url.search}`
}

// Helper GET typé pour les endpoints JSON internes.
export async function apiGet<T>(endpoint: string, options: ApiGetOptions = {}) {
  // On utilise fetch() directement pour rester compatible avec les AbortSignal et les query params.
  const response = await fetch(buildApiUrl(endpoint, options.params), {
    headers: { Accept: 'application/json' },
    signal: options.signal,
  })

  if (!response.ok) {
    // On remonte une erreur explicite au composant appelant, qui décide comment l'afficher.
    throw new Error(
      `Impossible de charger les données depuis ${endpoint} avec l'erreur ${response.status}`
    )
  }
  // On suppose que le backend renvoie toujours un JSON valide pour les endpoints internes.
  return (await response.json()) as T
}

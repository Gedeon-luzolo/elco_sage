import { clearToken, getToken, UNAUTHORIZED_EVENT } from '~/lib/api/token'
import { REQUEST_TIMEOUT_MS } from '~/lib/offline/config'
import { reportReachability } from '~/lib/offline/connectivity'

// Paramètres de requête : les valeurs absentes (null ou undefined) sont ignorées.
type Params = Record<string, string | number | boolean | null | undefined>

// Options d'une requête : le corps est du JSON sérialisé automatiquement.
type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  params?: Params
}

// URL de base de l'API (se termine par un slash pour que les endpoints relatifs s'y ajoutent).
const API_URL = import.meta.env.VITE_API_URL as string

// Erreur normalisée pour toutes les réponses API non valides.
// details contient la réponse brute du serveur, utile pour lire les erreurs de validation.
export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

// Prépare l'URL finale avec les paramètres de requête.
function buildUrl(endpoint: string, params?: Params) {
  const url = new URL(endpoint.replace(/^\//, ''), API_URL)

  // Seuls les paramètres réellement fournis sont ajoutés
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

// Exécute une requête HTTP et déballe l'enveloppe { data } du backend.
async function request<T>(endpoint: string, options: RequestOptions = {}) {
  const { body, params, headers, ...requestOptions } = options
  const token = getToken()

  const response = await fetch(buildUrl(endpoint, params), {
    // Sans réponse dans le délai, la requête est considérée perdue (comme une coupure réseau)
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    // Le serveur n'a pas répondu : l'application bascule en mode hors ligne
    reportReachability(false)
    throw new ApiError('Serveur injoignable.', 0)
  })

  // Une réponse, même une erreur, prouve que le serveur est joignable
  reportReachability(true)

  // Pas de contenu : rien à lire
  if (response.status === 204) {
    return undefined as T
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : undefined

  if (!response.ok) {
    // Un token refusé (hors connexion) renvoie à l'écran de connexion
    if (response.status === 401 && token) {
      clearToken()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }

    // VineJS renvoie { errors: [{ message }] } et nos erreurs métier { message }
    const message =
      typeof payload?.message === 'string'
        ? payload.message
        : (payload?.errors?.[0]?.message ?? 'Une erreur est survenue.')

    throw new ApiError(message, response.status, payload)
  }

  // Déballe { data } même quand data vaut null (ex : aucune session ouverte)
  return (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload) as T
}

// Méthodes HTTP utilisées par les hooks.
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T = void>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}

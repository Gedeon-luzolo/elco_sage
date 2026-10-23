import { clearToken, getToken, UNAUTHORIZED_EVENT } from '~/lib/api/token'

type Params = Record<string, string | number | boolean | null | undefined>

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  params?: Params
}

// URL de base de l'API (se termine par un slash pour que les endpoints relatifs s'y ajoutent).
const API_URL = import.meta.env.VITE_API_URL as string

// Erreur de validation renvoyee par VineJS : { errors: [{ field, message }] }.
export interface FieldError {
  field: string
  message: string
}

// Erreur normalisee pour toutes les reponses API non valides.
export class ApiError extends Error {
  status: number
  fieldErrors: FieldError[]

  constructor(message: string, status: number, fieldErrors: FieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// Prepare l'URL finale avec les query params (les valeurs absentes sont ignorees).
function buildUrl(endpoint: string, params?: Params) {
  const url = new URL(endpoint.replace(/^\//, ''), API_URL)

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

// Execute une requete HTTP et deballe l'enveloppe { data } du backend.
async function request<T>(endpoint: string, options: RequestOptions = {}) {
  const { body, params, headers, ...requestOptions } = options
  const token = getToken()

  const response = await fetch(buildUrl(endpoint, params), {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new ApiError('Serveur injoignable.', 0)
  })

  if (response.status === 204) {
    return undefined as T
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : undefined

  if (!response.ok) {
    // Un token refuse (hors login) force le retour a l'ecran de connexion.
    if (response.status === 401 && token) {
      clearToken()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }

    const fieldErrors: FieldError[] = Array.isArray(payload?.errors) ? payload.errors : []
    const message =
      typeof payload?.message === 'string'
        ? payload.message
        : (fieldErrors[0]?.message ?? 'Une erreur est survenue.')

    throw new ApiError(message, response.status, fieldErrors)
  }

  // Deballe { data } meme quand data vaut null (ex: aucune session ouverte).
  return (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload) as T
}

// Methodes HTTP utilisees par les hooks.
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

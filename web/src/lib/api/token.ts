// Le token d'acces survit aux rechargements (et au mode hors ligne) via localStorage.
const TOKEN_KEY = 'elco_sage_token'

export const UNAUTHORIZED_EVENT = 'elco:unauthorized'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Stockage indisponible (navigation privee) : la session ne survivra pas au rechargement.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Rien a nettoyer si le stockage est inaccessible.
  }
}

// Le token d'accès survit aux rechargements (et au mode hors ligne) via localStorage.
const TOKEN_KEY = 'elco_sage_token'

// Événement émis quand le serveur refuse le token (expiré ou révoqué).
export const UNAUTHORIZED_EVENT = 'elco:unauthorized'

// Lit le token enregistré, ou null s'il n'y en a pas ou si le stockage est inaccessible.
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

// Enregistre le token après la connexion.
export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Stockage indisponible (navigation privée) : la session ne survivra pas au rechargement
  }
}

// Supprime le token à la déconnexion.
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Rien à nettoyer si le stockage est inaccessible
  }
}

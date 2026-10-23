// Préfixes des clés de requête disponibles hors ligne (lecture) et rafraîchies après une synchronisation.
export const OFFLINE_QUERY_PREFIXES = [
  '/auth/me',
  '/cash-sessions',
  '/product-services/active-for-sale',
  '/operators',
  '/customers/active-for-sale',
  '/exchange-rates',
  '/sales',
  '/debts',
  '/recoveries',
  '/stock',
]

// Durée de conservation du cache de lecture (7 jours).
export const OFFLINE_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7

// Délai au-delà duquel une requête est considérée comme perdue.
export const REQUEST_TIMEOUT_MS = 15_000

// Intervalle entre deux tentatives d'envoi automatique de la file.
export const AUTO_SYNC_INTERVAL_MS = 30_000

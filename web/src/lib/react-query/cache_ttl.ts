// Durées de fraîcheur des données (staleTime) : tant qu'une donnée est fraîche, elle est servie
// depuis le cache sans interroger le serveur. À 0, elle est relue à chaque ouverture de page.
export const STALE_TIME = {
  ALWAYS_REFETCH: 0,
  MINUTES_1: 1000 * 60,
  MINUTES_5: 1000 * 60 * 5,
} as const

// État de joignabilité du serveur : alimenté par les vraies requêtes, pas seulement par
// navigator.onLine (qui reste vrai sur un réseau local sans accès au serveur).
let serverReachable = true
const listeners = new Set<() => void>()

// Enregistre le résultat de la dernière requête et prévient l'interface en cas de changement.
export function reportReachability(reachable: boolean) {
  if (reachable === serverReachable) return

  serverReachable = reachable
  listeners.forEach((listener) => listener())
}

// Permet à l'interface de s'abonner aux changements de connectivité.
export function subscribeConnectivity(listener: () => void) {
  listeners.add(listener)
  // Les événements du navigateur complètent les résultats des requêtes
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

// Vrai quand le navigateur est connecté ET que le serveur a répondu à la dernière requête.
export function isOnlineSnapshot() {
  return serverReachable && navigator.onLine
}

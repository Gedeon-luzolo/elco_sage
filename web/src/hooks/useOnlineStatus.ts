import { useSyncExternalStore } from 'react'
import { isOnlineSnapshot, subscribeConnectivity } from '~/lib/offline/connectivity'

// Vrai quand le navigateur est connecté ET que le serveur a répondu à la dernière requête.
export function useOnlineStatus() {
  return useSyncExternalStore(subscribeConnectivity, isOnlineSnapshot)
}

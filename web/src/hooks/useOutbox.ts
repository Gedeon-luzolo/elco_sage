import { useSyncExternalStore } from 'react'
import { getOutboxSnapshot, subscribeOutbox } from '~/lib/offline/outbox'

// File des écritures faites hors ligne (réactive).
export function useOutbox() {
  return useSyncExternalStore(subscribeOutbox, getOutboxSnapshot)
}

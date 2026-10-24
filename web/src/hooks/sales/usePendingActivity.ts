import { useMemo } from 'react'
import { useOutbox } from '~/hooks/useOutbox'
import { getPendingActivity } from '~/lib/offline/pending_report'

// Opérations faites hors ligne et pas encore envoyées, qui concernent la session donnée.
export function usePendingActivity(session: { id: string; status: string } | null | undefined) {
  const outbox = useOutbox()

  // Recalculé seulement quand la file ou la session change
  return useMemo(
    () => getPendingActivity(outbox, session),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outbox, session?.id, session?.status]
  )
}

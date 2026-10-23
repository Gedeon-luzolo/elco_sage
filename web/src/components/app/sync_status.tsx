import { CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { SyncQueueDialog } from '~/components/app/sync_queue_dialog'
import { Button } from '~/components/ui/button'
import { useOnlineStatus } from '~/hooks/useOnlineStatus'
import { useOutbox } from '~/hooks/useOutbox'

// Indicateur de la barre d'application : visible seulement s'il y a quelque chose à signaler.
export function SyncStatus() {
  // État du réseau et opérations gardées sur l'appareil
  const isOnline = useOnlineStatus()
  const entries = useOutbox()
  const [isOpen, setIsOpen] = useState(false)

  // Les opérations refusées par le serveur sont comptées à part des opérations en attente
  const pendingCount = entries.filter((entry) => entry.status === 'pending').length
  const conflictCount = entries.length - pendingCount

  // Tout va bien : rien à afficher
  if (isOnline && entries.length === 0) {
    return null
  }

  // Libellé composé des éléments utiles seulement
  const label = [
    !isOnline && 'Hors ligne',
    pendingCount > 0 && `${pendingCount} en attente`,
    conflictCount > 0 && `${conflictCount} refusée(s)`,
  ]
    .filter(Boolean)
    .join(' · ')

  // Une opération refusée est le signal le plus important
  const Icon = conflictCount > 0 ? TriangleAlert : isOnline ? RefreshCw : CloudOff

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={conflictCount > 0 ? 'border-destructive text-destructive' : undefined}
        onClick={() => setIsOpen(true)}
      >
        <Icon className="size-4" />
        {label}
      </Button>
      <SyncQueueDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}

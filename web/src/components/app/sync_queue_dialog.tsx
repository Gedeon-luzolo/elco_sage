import { RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { ConfirmationDialog } from '~/components/ui/confirmation_dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { useAuth } from '~/hooks/auth/useAuth'
import { useOnlineStatus } from '~/hooks/useOnlineStatus'
import { useOutbox } from '~/hooks/useOutbox'
import type { OutboxEntry } from '~/lib/offline/db'
import { removeEntry, retryEntry } from '~/lib/offline/outbox'
import { flushOutbox } from '~/lib/offline/sync'
import { formatDateTimeLabel } from '~/utils/date'

// Propriétés du dialogue : ouverture et fermeture contrôlées par le parent.
interface SyncQueueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// File d'attente des opérations faites hors ligne : envoi manuel, reprise ou abandon des refus.
export function SyncQueueDialog({ open, onOpenChange }: SyncQueueDialogProps) {
  // Utilisateur connecté, état du réseau et contenu de la file
  const { user } = useAuth()
  const entries = useOutbox()
  const isOnline = useOnlineStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const [entryToDiscard, setEntryToDiscard] = useState<OutboxEntry | null>(null)

  // Envoie la file maintenant et résume le résultat en toast
  const syncNow = async () => {
    if (!user) return

    setIsSyncing(true)
    try {
      const result = await flushOutbox(user.id)

      // Panne, refus ou succès : trois messages différents
      if (result.interrupted) {
        toast.error('Le serveur ne répond pas. Les opérations restent en attente.')
      } else if (result.conflicts > 0) {
        toast.warning(`${result.conflicts} opération(s) refusée(s) par le serveur.`)
      } else {
        toast.success('Toutes les opérations ont été envoyées.')
      }
    } finally {
      setIsSyncing(false)
    }
  }

  // Remet une opération refusée dans la file puis relance l'envoi
  const retry = async (entry: OutboxEntry) => {
    await retryEntry(entry.id)
    await syncNow()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Opérations en attente</DialogTitle>
            <DialogDescription>
              {isOnline
                ? 'Ces opérations ont été faites sans réseau et ne sont pas encore sur le serveur.'
                : 'Hors ligne : elles seront envoyées automatiquement au retour du réseau.'}
            </DialogDescription>
          </DialogHeader>

          {/* Liste des opérations, ou message quand la file est vide */}
          {entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune opération en attente.
            </p>
          ) : (
            <ul className="grid max-h-96 gap-2 overflow-y-auto">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{entry.summary}</span>
                    <Badge variant={entry.status === 'conflict' ? 'destructive' : 'secondary'}>
                      {entry.status === 'conflict' ? 'Refusée' : 'En attente'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTimeLabel(new Date(entry.createdAt))}
                  </p>
                  {/* Raison du refus donnée par le serveur */}
                  {entry.error && <p className="mt-2 text-xs text-destructive">{entry.error}</p>}

                  {entry.status === 'conflict' && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!isOnline || isSyncing}
                        onClick={() => void retry(entry)}
                      >
                        <RefreshCw className="size-3.5" />
                        Réessayer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setEntryToDiscard(entry)}
                      >
                        <Trash2 className="size-3.5" />
                        Abandonner
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            disabled={
              !isOnline || isSyncing || !entries.some((entry) => entry.status === 'pending')
            }
            onClick={() => void syncNow()}
          >
            <RefreshCw className={isSyncing ? 'size-4 animate-spin' : 'size-4'} />
            {isSyncing ? 'Envoi...' : 'Envoyer maintenant'}
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(entryToDiscard)}
        title="Abandonner cette opération ?"
        description="Elle ne sera jamais envoyée au serveur. Le ticket déjà imprimé ne correspondra à aucune vente enregistrée."
        confirmLabel="Abandonner"
        variant="destructive"
        onOpenChange={(isOpen) => !isOpen && setEntryToDiscard(null)}
        onConfirm={async () => {
          // L'abandon est définitif : l'opération ne sera jamais envoyée
          if (entryToDiscard) await removeEntry(entryToDiscard.id)
          setEntryToDiscard(null)
        }}
      />
    </>
  )
}

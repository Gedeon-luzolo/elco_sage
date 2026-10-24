import { AnimatePresence, motion } from 'framer-motion'
import { CloudOff, Wifi, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useOnlineStatus } from '~/hooks/useOnlineStatus'

// Durée d'affichage de la confirmation de retour du réseau.
const RECONNECTED_NOTICE_DURATION_MS = 5 * 1000

type Notice = 'offline' | 'reconnected' | null

// Bande d'information sous la barre de navigation sur l'état de la connexion.
export function OfflineNotice() {
  const isOnline = useOnlineStatus()
  const [notice, setNotice] = useState<Notice>(null)
  // Sert à ne confirmer le retour du réseau que s'il y a eu une coupure
  const wasOffline = useRef(false)

  useEffect(() => {
    // Coupure : la bande reste affichée jusqu'à ce que l'utilisateur la ferme ou que le réseau revienne
    if (!isOnline) {
      wasOffline.current = true
      setNotice('offline')
      return
    }

    // Démarrage en ligne : rien à confirmer
    if (!wasOffline.current) return

    wasOffline.current = false
    setNotice('reconnected')
    const timerId = window.setTimeout(() => setNotice(null), RECONNECTED_NOTICE_DURATION_MS)

    // Le délai est annulé si une nouvelle coupure arrive avant la fin
    return () => window.clearTimeout(timerId)
  }, [isOnline])

  const isReconnected = notice === 'reconnected'
  const Icon = isReconnected ? Wifi : CloudOff

  return (
    <AnimatePresence>
      {notice !== null && (
        <motion.div
          key={notice}
          role="status"
          className={`flex items-center gap-3 overflow-hidden border-b px-4 text-sm ${
            isReconnected
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-amber-300 bg-amber-50 text-amber-800'
          }`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 36, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />

          <p className="flex-1 truncate">
            {isReconnected
              ? 'Connexion rétablie : les opérations en attente vont être envoyées.'
              : 'Mode hors ligne : ventes et recouvrements possibles, envoyés au retour du réseau. Clôture de caisse et gestion limitées.'}
          </p>

          {!isReconnected && (
            <button
              type="button"
              aria-label="Fermer"
              className="shrink-0 transition-opacity hover:opacity-70"
              onClick={() => setNotice(null)}
            >
              <X className="size-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

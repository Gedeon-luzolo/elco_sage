import { ApiError, api } from '~/lib/api/fetch'
import { AUTO_SYNC_INTERVAL_MS, OFFLINE_QUERY_PREFIXES } from '~/lib/offline/config'
import { getOutboxSnapshot, markAttempt, markConflict, removeEntry } from '~/lib/offline/outbox'
import { invalidateQueriesByPrefix } from '~/lib/react-query/query_client'

// Bilan d'un envoi de la file.
// interrupted vaut vrai si l'envoi s'est arrêté sur une panne (réseau, serveur, session) :
// des entrées restent alors à rejouer.
export interface FlushResult {
  synced: number
  conflicts: number
  interrupted: boolean
}

let running: Promise<FlushResult> | null = null

// Rejoue la file dans l'ordre de création, pour l'utilisateur connecté uniquement :
// - succès : l'entrée est retirée (un rejeu déjà traité par le serveur est aussi un succès) ;
// - refus métier (4xx) : l'entrée passe en conflit et la suite continue ;
// - panne (réseau, 5xx, 401) : l'envoi s'arrête, les entrées restent en attente.
export function flushOutbox(userId: string): Promise<FlushResult> {
  // Un seul envoi à la fois : deux envois en parallèle rejoueraient les mêmes entrées
  running ??= doFlush(userId).finally(() => {
    running = null
  })

  return running
}

// Parcourt les entrées en attente et les envoie une par une.
async function doFlush(userId: string): Promise<FlushResult> {
  const result: FlushResult = { synced: 0, conflicts: 0, interrupted: false }

  // Seules les entrées de cet utilisateur, encore en attente, sont rejouées
  const queue = getOutboxSnapshot().filter(
    (entry) => entry.userId === userId && entry.status === 'pending'
  )

  for (const entry of queue) {
    try {
      await api.post(entry.path, entry.body)
      // Le serveur a accepté (ou reconnu) l'opération : elle sort de la file
      await removeEntry(entry.id)
      result.synced += 1
    } catch (error) {
      const isOutage =
        !(error instanceof ApiError) ||
        error.status === 0 ||
        error.status >= 500 ||
        error.status === 401

      // Panne : on garde l'entrée et on arrête, les suivantes échoueraient aussi
      if (isOutage) {
        await markAttempt(entry.id)
        result.interrupted = true
        break
      }

      // Refus métier : l'entrée devient visible pour être traitée, la suite continue
      await markConflict(entry.id, (error as ApiError).message)
      result.conflicts += 1
    }
  }

  // Les listes affichées doivent refléter ce que le serveur vient d'enregistrer
  if (result.synced > 0) {
    invalidateQueriesByPrefix(OFFLINE_QUERY_PREFIXES)
  }

  return result
}

// Lance les envois au démarrage, au retour du réseau et à intervalle régulier.
export function startAutoSync(userId: string) {
  // N'envoie que s'il y a quelque chose à envoyer et que le navigateur est connecté
  const flush = () => {
    if (navigator.onLine && getOutboxSnapshot().some((entry) => entry.status === 'pending')) {
      void flushOutbox(userId)
    }
  }

  flush()
  window.addEventListener('online', flush)
  const intervalId = window.setInterval(flush, AUTO_SYNC_INTERVAL_MS)

  // Nettoyage quand l'utilisateur change ou que l'application se ferme
  return () => {
    window.removeEventListener('online', flush)
    window.clearInterval(intervalId)
  }
}

import { ApiError, api } from '~/lib/api/fetch'
import type { OutboxEntry } from '~/lib/offline/db'
import { enqueue } from '~/lib/offline/outbox'

// Champs de l'opération à envoyer, qui sont aussi ceux conservés dans la file.
type QueuedFields = Pick<
  OutboxEntry,
  'id' | 'type' | 'userId' | 'path' | 'body' | 'summary' | 'sale'
>

// Résultat d'un envoi : soit la réponse du serveur, soit l'entrée mise en file.
type SubmitResult<T> = { queued: false; data: T } | { queued: true; entry: OutboxEntry }

// Envoie une écriture au serveur ; si le réseau est coupé, la met dans la file pour plus tard.
export async function submitOrQueue<T>(operation: QueuedFields): Promise<SubmitResult<T>> {
  try {
    // Inutile d'attendre un délai d'expiration quand le navigateur sait déjà qu'il est hors ligne
    if (!navigator.onLine) {
      throw new ApiError('Serveur injoignable.', 0)
    }

    return { queued: false, data: await api.post<T>(operation.path, operation.body) }
  } catch (error) {
    // Statut 0 : le serveur n'a pas répondu, l'opération est gardée pour plus tard
    if (error instanceof ApiError && error.status === 0) {
      return { queued: true, entry: await enqueue(operation) }
    }

    // Tout autre échec est un vrai refus à montrer tout de suite
    throw error
  }
}

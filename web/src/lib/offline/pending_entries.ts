import type { OutboxEntry, OutboxType } from '~/lib/offline/db'

// Entrées de la file encore à envoyer, éventuellement d'un seul type.
// Un conflit a été refusé par le serveur : il n'existera jamais, donc il n'est jamais compté.
export function getPendingEntries(entries: OutboxEntry[], type?: OutboxType) {
  return entries.filter((entry) => entry.status === 'pending' && (!type || entry.type === type))
}

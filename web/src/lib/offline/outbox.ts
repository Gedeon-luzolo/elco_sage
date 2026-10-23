import { getDb, type OutboxEntry } from '~/lib/offline/db'

// Copie en mémoire de la file : l'interface la lit en synchrone via useSyncExternalStore.
let entries: OutboxEntry[] = []
const listeners = new Set<() => void>()

// Remplace la copie en mémoire (triée par date de création) et prévient l'interface.
function publish(next: OutboxEntry[]) {
  entries = next.toSorted((a, b) => a.createdAt - b.createdAt)
  listeners.forEach((listener) => listener())
}

// Permet à l'interface de s'abonner aux changements de la file.
export function subscribeOutbox(listener: () => void) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

// Retourne l'état courant de la file (référence stable tant qu'il ne change pas).
export function getOutboxSnapshot() {
  return entries
}

// Recharge la file depuis IndexedDB, au démarrage de l'application.
export async function loadOutbox() {
  publish(await (await getDb()).getAll('outbox'))
}

// Ajoute une opération à la file, en attente d'envoi.
export async function enqueue(
  entry: Omit<OutboxEntry, 'createdAt' | 'status' | 'error' | 'attempts'>
) {
  // Une nouvelle entrée démarre toujours en attente, sans erreur ni tentative
  const stored: OutboxEntry = {
    ...entry,
    createdAt: Date.now(),
    status: 'pending',
    error: null,
    attempts: 0,
  }

  // Écriture durable d'abord, puis mise à jour de la copie en mémoire
  await (await getDb()).put('outbox', stored)
  publish([...entries.filter((item) => item.id !== stored.id), stored])

  return stored
}

// Modifie une entrée existante, en base puis en mémoire.
async function update(id: string, patch: Partial<OutboxEntry>) {
  const current = entries.find((item) => item.id === id)
  if (!current) return

  const next = { ...current, ...patch }
  await (await getDb()).put('outbox', next)
  publish(entries.map((item) => (item.id === id ? next : item)))
}

// Le serveur a refusé l'opération : elle reste visible pour être traitée par une personne.
export function markConflict(id: string, error: string) {
  const attempts = (entries.find((item) => item.id === id)?.attempts ?? 0) + 1

  return update(id, { status: 'conflict', error, attempts })
}

// Échec temporaire (réseau, serveur) : l'entrée reste à rejouer.
export function markAttempt(id: string) {
  const attempts = (entries.find((item) => item.id === id)?.attempts ?? 0) + 1

  return update(id, { attempts })
}

// Remet une entrée refusée dans la file des envois.
export function retryEntry(id: string) {
  return update(id, { status: 'pending', error: null })
}

// Supprime une entrée (envoyée avec succès ou abandonnée).
export async function removeEntry(id: string) {
  await (await getDb()).delete('outbox', id)
  publish(entries.filter((item) => item.id !== id))
}

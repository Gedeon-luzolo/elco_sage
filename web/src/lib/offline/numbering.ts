import { api } from '~/lib/api/fetch'
import { getDb, type NumberingState } from '~/lib/offline/db'

// En dessous de ce nombre de numéros restants, une nouvelle plage est réservée (si le serveur répond).
export const LOW_NUMBERS_THRESHOLD = 20

// Réponse du serveur : les plages réservées à l'utilisateur et son dernier numéro utilisé.
interface ServerNumberingState {
  blocks: NumberingState['blocks']
  lastUsedNumber: number | null
}

// Format des numéros d'addition : 5 chiffres (ex : 42 devient "00042").
export const formatAdditionNumber = (value: number) => String(value).padStart(5, '0')

// Trie les plages par ordre croissant pour parcourir les numéros dans l'ordre.
function sortedBlocks(state: NumberingState) {
  return state.blocks.toSorted((a, b) => a.startNumber - b.startNumber)
}

// Prochain numéro libre dans les plages réservées, ou null si elles sont épuisées.
export function nextNumber(state: NumberingState): number | null {
  for (const block of sortedBlocks(state)) {
    // Premier numéro de la plage qui n'a pas encore été consommé
    const candidate = Math.max(block.startNumber, state.cursor + 1)

    if (candidate <= block.endNumber) {
      return candidate
    }
  }

  return null
}

// Nombre de numéros encore utilisables sur l'ensemble des plages.
export function remainingNumbers(state: NumberingState) {
  return state.blocks.reduce((total, block) => {
    const first = Math.max(block.startNumber, state.cursor + 1)

    return total + Math.max(0, block.endNumber - first + 1)
  }, 0)
}

// Clé de la numérotation locale : un état par utilisateur et par session.
function numberingKey(cashSessionId: string, userId: string) {
  return `${userId}:${cashSessionId}`
}

// Lit l'état de la numérotation locale d'un utilisateur dans une session.
export async function getNumberingState(cashSessionId: string, userId: string) {
  return (await (await getDb()).get('numbering', numberingKey(cashSessionId, userId))) ?? null
}

// Fusionne l'état du serveur avec l'état local : le curseur ne recule jamais,
// même après une perte du cache local.
export function mergeServerState(
  local: NumberingState | null,
  cashSessionId: string,
  userId: string,
  server: ServerNumberingState
): NumberingState {
  return {
    id: numberingKey(cashSessionId, userId),
    cashSessionId,
    userId,
    blocks: server.blocks,
    cursor: Math.max(local?.cursor ?? 0, server.lastUsedNumber ?? 0),
  }
}

// Enregistre l'état fusionné en base locale.
async function saveServerState(
  cashSessionId: string,
  userId: string,
  server: ServerNumberingState
) {
  const db = await getDb()
  const merged = mergeServerState(
    await getNumberingState(cashSessionId, userId),
    cashSessionId,
    userId,
    server
  )
  await db.put('numbering', merged)

  return merged
}

// Synchronise la numérotation avec le serveur et réserve une plage si elle s'épuise.
// À appeler quand le serveur répond et qu'une session de caisse est ouverte.
export async function refreshNumbering(cashSessionId: string, userId: string) {
  // Récupération des plages déjà réservées à l'utilisateur et de son dernier numéro utilisé
  let state = await saveServerState(
    cashSessionId,
    userId,
    await api.get<ServerNumberingState>('/cash-sessions/current/addition-numbers')
  )

  // Réservation d'une nouvelle plage quand il reste peu de numéros
  if (remainingNumbers(state) < LOW_NUMBERS_THRESHOLD) {
    state = await saveServerState(
      cashSessionId,
      userId,
      await api.post<ServerNumberingState>('/cash-sessions/current/addition-numbers')
    )
  }

  return state
}

// Numéro que la prochaine vente utilisera (sans le consommer), ou null s'il n'y en a plus.
export async function peekNextNumber(cashSessionId: string, userId: string) {
  const state = await getNumberingState(cashSessionId, userId)
  const value = state ? nextNumber(state) : null

  return value === null ? null : formatAdditionNumber(value)
}

// Marque un numéro comme consommé, une fois la vente envoyée ou mise en file.
export async function commitNumber(cashSessionId: string, userId: string, additionNumber: string) {
  const db = await getDb()
  const state = await getNumberingState(cashSessionId, userId)

  // Sans état local, il n'y a rien à faire avancer
  if (!state) return

  // Le curseur avance toujours, il ne recule jamais
  await db.put('numbering', { ...state, cursor: Math.max(state.cursor, Number(additionNumber)) })
}

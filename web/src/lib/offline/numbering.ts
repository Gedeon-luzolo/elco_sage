import { api } from '~/lib/api/fetch'
import { getDb, type NumberingState } from '~/lib/offline/db'

// Réponse du serveur : la lettre du vendeur et le dernier compteur qu'il a utilisé hors ligne.
interface ServerNumberingState {
  sellerCode: string
  lastCounter: number
}

// Format des références hors ligne : la lettre du vendeur puis 4 chiffres (ex : A0009).
const formatOfflineReference = (sellerCode: string, counter: number) =>
  `${sellerCode}${String(counter).padStart(4, '0')}`

// Lit l'état de la numérotation locale d'un vendeur.
async function getNumberingState(userId: string) {
  return (await (await getDb()).get('numbering', userId)) ?? null
}

// Synchronise la lettre et le curseur avec le serveur. Le curseur ne recule jamais,
// même après une perte du cache local. À appeler quand le serveur répond.
export async function refreshNumbering(userId: string) {
  const server = await api.get<ServerNumberingState>('/sales/offline-reference')
  const local = await getNumberingState(userId)
  const state: NumberingState = {
    id: userId,
    sellerCode: server.sellerCode,
    cursor: Math.max(local?.cursor ?? 0, server.lastCounter),
  }

  await (await getDb()).put('numbering', state)

  return state
}

// Référence que la prochaine vente hors ligne utilisera (sans la consommer),
// ou null si le vendeur ne s'est encore jamais connecté au serveur.
export async function peekOfflineReference(userId: string) {
  const state = await getNumberingState(userId)

  return state ? formatOfflineReference(state.sellerCode, state.cursor + 1) : null
}

// Marque une référence comme consommée, une fois la vente mise en file.
export async function commitOfflineReference(userId: string, offlineReference: string) {
  const db = await getDb()
  const state = await getNumberingState(userId)

  // Sans état local, il n'y a rien à faire avancer
  if (!state) return

  // Le compteur est la partie chiffrée de la référence (A0009 donne 9)
  const counter = Number(offlineReference.replace(/^[A-Z]+/, ''))

  // Le curseur avance toujours, il ne recule jamais
  await db.put('numbering', { ...state, cursor: Math.max(state.cursor, counter) })
}

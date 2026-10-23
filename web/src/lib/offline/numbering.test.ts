import { describe, expect, it, vi } from 'vitest'
import { api } from '~/lib/api/fetch'
import {
  commitNumber,
  mergeServerState,
  nextNumber,
  peekNextNumber,
  refreshNumbering,
  remainingNumbers,
} from '~/lib/offline/numbering'

// Le client HTTP est simulé : seules les réponses du serveur changent d'un test à l'autre.
vi.mock('~/lib/api/fetch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/lib/api/fetch')>()),
  api: { get: vi.fn(), post: vi.fn() },
}))

const blocks = [
  { startNumber: 1, endNumber: 3 },
  { startNumber: 10, endNumber: 12 },
]

// Plage réaliste : au-dessus du seuil, aucune réservation supplémentaire n'est déclenchée.
const bigBlocks = [{ startNumber: 1, endNumber: 100 }]

describe('numérotation locale', () => {
  it('donne le premier numéro libre puis saute au bloc suivant', () => {
    // Le curseur est le dernier numéro consommé
    expect(nextNumber({ cashSessionId: 's', blocks, cursor: 0 })).toBe(1)
    expect(nextNumber({ cashSessionId: 's', blocks, cursor: 3 })).toBe(10)
    expect(nextNumber({ cashSessionId: 's', blocks, cursor: 11 })).toBe(12)
    expect(nextNumber({ cashSessionId: 's', blocks, cursor: 12 })).toBeNull()
  })

  it('compte les numéros restants sur tous les blocs', () => {
    expect(remainingNumbers({ cashSessionId: 's', blocks, cursor: 0 })).toBe(6)
    expect(remainingNumbers({ cashSessionId: 's', blocks, cursor: 2 })).toBe(4)
    expect(remainingNumbers({ cashSessionId: 's', blocks, cursor: 12 })).toBe(0)
  })

  it('ne fait jamais reculer le curseur, même si le serveur connaît un numéro plus petit', () => {
    const local = { cashSessionId: 's', blocks, cursor: 11 }

    // Le serveur est en retard : le curseur local gagne
    expect(mergeServerState(local, 's', { blocks, lastUsedNumber: 2 }).cursor).toBe(11)
    // Le serveur est en avance : son numéro gagne
    expect(mergeServerState(local, 's', { blocks, lastUsedNumber: 12 }).cursor).toBe(12)
    // Aucun état local ni vente côté serveur : on repart de zéro
    expect(mergeServerState(null, 's', { blocks, lastUsedNumber: null }).cursor).toBe(0)
  })

  it('retrouve son curseur depuis le serveur après une perte du cache local', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ blocks: bigBlocks, lastUsedNumber: 2 })

    await refreshNumbering('s')

    expect(await peekNextNumber('s')).toBe('00003')
  })

  it('consomme les numéros dans l’ordre sans jamais en réutiliser', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ blocks: bigBlocks, lastUsedNumber: null })
    await refreshNumbering('s')

    expect(await peekNextNumber('s')).toBe('00001')
    // Consulter le numéro ne le consomme pas : il reste proposé tant qu'il n'est pas validé
    expect(await peekNextNumber('s')).toBe('00001')

    await commitNumber('s', '00001')
    expect(await peekNextNumber('s')).toBe('00002')
  })

  it('réserve une nouvelle plage quand il en reste peu', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ blocks, lastUsedNumber: null })
    vi.mocked(api.post).mockResolvedValueOnce({
      blocks: [...blocks, { startNumber: 20, endNumber: 119 }],
      lastUsedNumber: null,
    })

    const state = await refreshNumbering('s')

    expect(api.post).toHaveBeenCalledWith('/cash-sessions/current/addition-numbers')
    expect(remainingNumbers(state)).toBe(106)
  })

  it('ne réserve rien quand il reste assez de numéros', async () => {
    vi.mocked(api.post).mockClear()
    vi.mocked(api.get).mockResolvedValueOnce({ blocks: bigBlocks, lastUsedNumber: null })

    await refreshNumbering('s')

    expect(api.post).not.toHaveBeenCalled()
  })

  it('renvoie null quand les plages sont épuisées', async () => {
    const exhausted = { blocks: [{ startNumber: 1, endNumber: 1 }], lastUsedNumber: 1 }
    vi.mocked(api.get).mockResolvedValueOnce(exhausted)
    vi.mocked(api.post).mockResolvedValueOnce(exhausted)
    await refreshNumbering('s')

    expect(await peekNextNumber('s')).toBeNull()
  })
})

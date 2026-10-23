import { describe, expect, it, vi } from 'vitest'
import { ApiError, api } from '~/lib/api/fetch'
import { getOutboxSnapshot, retryEntry } from '~/lib/offline/outbox'
import { submitOrQueue } from '~/lib/offline/submit'
import { flushOutbox } from '~/lib/offline/sync'

// Le client HTTP est simulé : chaque test choisit la réponse du serveur.
vi.mock('~/lib/api/fetch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/lib/api/fetch')>()),
  api: { get: vi.fn(), post: vi.fn() },
}))

// Opération de test : une vente minimale appartenant à un utilisateur.
const operation = (id: string, userId = 'u1') => ({
  id,
  type: 'sale' as const,
  userId,
  path: '/sales',
  body: { id },
  summary: `Vente ${id}`,
  sale: null,
})

describe('submitOrQueue', () => {
  it('envoie directement quand le serveur répond, sans rien mettre en file', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'a' })

    // Le serveur répond : la vente est créée directement
    const result = await submitOrQueue(operation('a'))

    expect(result).toEqual({ queued: false, data: { id: 'a' } })
    expect(getOutboxSnapshot()).toHaveLength(0)
  })

  it('met en file quand le réseau est coupé', async () => {
    // Statut 0 : aucune réponse du serveur
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError('Serveur injoignable.', 0))

    const result = await submitOrQueue(operation('a'))

    expect(result.queued).toBe(true)
    expect(getOutboxSnapshot().map((entry) => entry.id)).toEqual(['a'])
  })

  it('met en file sans appeler le serveur quand le navigateur est hors ligne', async () => {
    vi.mocked(api.post).mockClear()
    vi.stubGlobal('navigator', { onLine: false })

    const result = await submitOrQueue(operation('a'))

    expect(result.queued).toBe(true)
    expect(api.post).not.toHaveBeenCalled()
  })

  it('ne met jamais en file un refus du serveur : l’erreur remonte', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError('Stock insuffisant.', 422))

    await expect(submitOrQueue(operation('a'))).rejects.toThrow('Stock insuffisant.')
    expect(getOutboxSnapshot()).toHaveLength(0)
  })
})

describe('flushOutbox', () => {
  // Remplit la file comme si le réseau était coupé pendant les ventes
  const queue = async (...ids: string[]) => {
    vi.mocked(api.post).mockRejectedValue(new ApiError('Serveur injoignable.', 0))
    for (const id of ids) await submitOrQueue(operation(id))
    vi.mocked(api.post).mockReset()
  }

  it('rejoue dans l’ordre et vide la file', async () => {
    await queue('a', 'b', 'c')
    vi.mocked(api.post).mockResolvedValue({})

    const result = await flushOutbox('u1')

    expect(result).toEqual({ synced: 3, conflicts: 0, interrupted: false })
    expect(vi.mocked(api.post).mock.calls.map((call) => (call[1] as { id: string }).id)).toEqual([
      'a',
      'b',
      'c',
    ])
    expect(getOutboxSnapshot()).toHaveLength(0)
  })

  it('s’arrête au premier problème réseau et garde le reste en attente', async () => {
    await queue('a', 'b', 'c')
    vi.mocked(api.post)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new ApiError('Serveur injoignable.', 0))

    const result = await flushOutbox('u1')

    expect(result).toEqual({ synced: 1, conflicts: 0, interrupted: true })
    expect(getOutboxSnapshot().map((entry) => [entry.id, entry.status])).toEqual([
      ['b', 'pending'],
      ['c', 'pending'],
    ])
  })

  it('passe un refus métier en conflit et continue avec les suivantes', async () => {
    await queue('a', 'b', 'c')
    vi.mocked(api.post)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new ApiError('Stock insuffisant pour "Papier A4".', 422))
      .mockResolvedValueOnce({})

    const result = await flushOutbox('u1')

    expect(result).toEqual({ synced: 2, conflicts: 1, interrupted: false })
    const [conflict] = getOutboxSnapshot()
    expect(conflict).toMatchObject({
      id: 'b',
      status: 'conflict',
      error: 'Stock insuffisant pour "Papier A4".',
    })
  })

  it('ne rejoue pas les conflits, sauf après une reprise explicite', async () => {
    await queue('a')
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError('Refus.', 422))
    await flushOutbox('u1')

    // Un conflit n’est plus envoyé tant que personne ne l’a repris
    vi.mocked(api.post).mockClear()
    await flushOutbox('u1')
    expect(api.post).not.toHaveBeenCalled()

    await retryEntry('a')
    vi.mocked(api.post).mockResolvedValueOnce({})
    expect(await flushOutbox('u1')).toMatchObject({ synced: 1 })
  })

  it('ne rejoue que les entrées de l’utilisateur connecté', async () => {
    await queue('a')
    // Une opération d’un autre utilisateur est ajoutée à la file
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError('Serveur injoignable.', 0))
    await submitOrQueue(operation('b', 'u2'))
    vi.mocked(api.post).mockReset().mockResolvedValue({})

    await flushOutbox('u1')

    expect(getOutboxSnapshot().map((entry) => entry.id)).toEqual(['b'])
  })

  it('traite une session expirée (401) comme une panne : rien n’est perdu', async () => {
    await queue('a')
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError('Non authentifié.', 401))

    const result = await flushOutbox('u1')

    expect(result.interrupted).toBe(true)
    expect(getOutboxSnapshot()[0]).toMatchObject({ id: 'a', status: 'pending', attempts: 1 })
  })

  it('lance un seul envoi à la fois', async () => {
    await queue('a')
    vi.mocked(api.post).mockResolvedValue({})

    const [first, second] = await Promise.all([flushOutbox('u1'), flushOutbox('u1')])

    expect(first).toBe(second)
    expect(api.post).toHaveBeenCalledTimes(1)
  })
})

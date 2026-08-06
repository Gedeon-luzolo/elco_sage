import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'

/**
 * Valide la fermeture d'une session de caisse.
 */
export const closeCashSessionValidator = vine.create({
  closingAmountCdf: vine.number().min(0).nullable().optional(),
  closingAmountUsd: vine.number().min(0).nullable().optional(),
})

export type CloseCashSessionInput = InferInput<typeof closeCashSessionValidator>

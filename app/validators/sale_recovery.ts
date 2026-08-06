import { Currency } from '#types/currency'
import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'

/**
 * Valide l'enregistrement d'un recouvrement de vente a credit.
 */
export const createSaleRecoveryValidator = vine.create({
  amount: vine.number().min(0.01),
  currency: vine.enum(Object.values(Currency)),
  recoveredAt: vine.string().trim().nullable().optional(),
})

export type CreateSaleRecoveryValidatorInput = InferInput<typeof createSaleRecoveryValidator>

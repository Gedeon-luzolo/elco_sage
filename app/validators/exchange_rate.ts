import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'

/**
 * Valide les taux USD vers CDF saisis par le back-office.
 * Les deux taux doivent rester positifs pour proteger les conversions.
 */
export const createExchangeRateValidator = vine.create({
  exchangeRate: vine.number().positive(),
  sellRate: vine.number().positive(),
})

export type CreateExchangeRateInput = InferInput<typeof createExchangeRateValidator>

import { Currency } from '#types/currency'
import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'

/**
 * Valide l'ouverture d'une session de caisse.
 */
export const openCashSessionValidator = vine.create({
  openingAmount: vine.number().min(0).nullable().optional(),
  openingCurrency: vine.enum(Object.values(Currency)),
})

export type OpenCashSessionInput = InferInput<typeof openCashSessionValidator>

/**
 * Valide la fermeture d'une session de caisse.
 */
export const closeCashSessionValidator = vine.create({
  closingAmount: vine.number().min(0),
  closingCurrency: vine.enum(Object.values(Currency)),
})

export type CloseCashSessionInput = InferInput<typeof closeCashSessionValidator>

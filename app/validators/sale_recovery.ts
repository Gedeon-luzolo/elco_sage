import { Currency } from '#types/currency'
import vine from '@vinejs/vine'

/**
 * Valide l'enregistrement d'un recouvrement de vente a credit.
 */
export const createSaleRecoveryValidator = vine.create({
  id: vine.string().uuid().optional(),
  amount: vine.number().min(0.01),
  currency: vine.enum(Object.values(Currency)),
  recoveredAt: vine.string().trim().nullable().optional(),
})

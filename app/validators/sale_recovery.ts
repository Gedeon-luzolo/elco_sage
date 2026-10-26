import { Currency } from '#types/currency'
import { PaymentMethod } from '#types/payment_method'
import vine from '@vinejs/vine'

/**
 * Valide l'enregistrement d'un recouvrement de vente a credit.
 */
export const createSaleRecoveryValidator = vine.create({
  id: vine.string().uuid().optional(),
  amount: vine.number().min(0.01),
  currency: vine.enum(Object.values(Currency)),
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
  paymentReference: vine.string().trim().maxLength(100).nullable().optional(),
  recoveredAt: vine.string().trim().nullable().optional(),
})

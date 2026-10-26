import { SalePaymentType } from '#models/sale'
import { Currency } from '#types/currency'
import vine from '@vinejs/vine'

/**
 * Valide la creation d'une ligne de vente.
 */
const saleItemSchema = vine.object({
  productServiceId: vine.string().uuid(),
  quantity: vine.number().min(0.01),
})

/**
 * Valide la creation d'une vente avec ses lignes.
 */
export const createSaleValidator = vine.create({
  id: vine.string().uuid().optional(),
  additionNumber: vine
    .string()
    .regex(/^\d{1,6}$/)
    .optional(),
  cashSessionId: vine.string().uuid().nullable().optional(),
  customerId: vine.string().uuid().nullable(),
  operatorId: vine.string().uuid(),
  paymentType: vine.enum(Object.values(SalePaymentType)),
  saleDate: vine.string().trim().nullable().optional(),
  currency: vine.enum(Object.values(Currency)),
  discountAmount: vine.number().min(0).nullable().optional(),
  items: vine.array(saleItemSchema).minLength(1),
})

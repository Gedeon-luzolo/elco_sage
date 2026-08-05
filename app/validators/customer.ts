import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'
import { CustomerType } from '#models/customer'

// Champs communs entre creation et edition d'un customer.
const customerPayloadSchema = {
  fullName: vine.string().trim().minLength(2).maxLength(150),
  customerType: vine.enum(Object.values(CustomerType)),
  phoneNumber: vine.string().trim().maxLength(30).nullable().optional(),
  email: vine.string().trim().email().maxLength(254).nullable().optional(),
}

/**
 * Valide les donnees de creation d'un customer.
 */
export const createCustomerValidator = vine.create(customerPayloadSchema)

export type CreateCustomerInput = InferInput<typeof createCustomerValidator>

/**
 * Valide les donnees de modification d'un customer.
 * isActive reste optionnel pour permettre de corriger les informations sans changer le statut.
 */
export const updateCustomerValidator = vine.create({
  ...customerPayloadSchema,
  isActive: vine.boolean().nullable().optional(),
})

export type UpdateCustomerInput = InferInput<typeof updateCustomerValidator>

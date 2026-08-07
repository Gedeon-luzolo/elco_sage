import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'
import { Currency } from '#types/currency'

/**
 * Valide les données de création d'un produit ou service.
 * L'utilisateur renseigne un montant unique `price` et la `currency` (Currency.CDF ou Currency.USD).
 */
export const createProductServiceValidator = vine.compile(
  vine.object({
    type: vine.enum(['PRODUCT', 'SERVICE']),
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(150)
      .unique({ table: 'product_services', column: 'name' }),
    categoryId: vine.string().uuid().nullable().optional(),
    stockProductId: vine.string().uuid().nullable().optional(),
    baseUnit: vine.string().trim().minLength(1).maxLength(50),
    packagingUnit: vine.string().trim().maxLength(50).nullable().optional(),
    packagingCapacity: vine.number().min(1).nullable().optional(),
    price: vine.number().min(0),
    currency: vine.enum(Object.values(Currency)),
  })
)

export type CreateProductServiceInput = InferInput<typeof createProductServiceValidator>

/**
 * Valide les données de modification d'un produit ou service.
 */
export const updateProductServiceValidator = vine.compile(
  vine.object({
    type: vine.enum(['PRODUCT', 'SERVICE']),
    name: vine.string().trim().minLength(2).maxLength(150),
    categoryId: vine.string().uuid().nullable().optional(),
    stockProductId: vine.string().uuid().nullable().optional(),
    baseUnit: vine.string().trim().minLength(1).maxLength(50),
    packagingUnit: vine.string().trim().maxLength(50).nullable().optional(),
    packagingCapacity: vine.number().min(1).nullable().optional(),
    price: vine.number().min(0),
    currency: vine.enum(Object.values(Currency)),
    isActive: vine.boolean(),
  })
)

export type UpdateProductServiceInput = InferInput<typeof updateProductServiceValidator>

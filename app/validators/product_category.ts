import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'

/**
 * Valide les données de création d'une catégorie.
 * isActive est exclu intentionnellement : le backend l'initialise toujours à true.
 */
export const createProductCategoryValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .unique({ table: 'product_categories', column: 'name' }),
    description: vine.string().trim().maxLength(500).nullable().optional(),
  })
)

export type CreateProductCategoryInput = InferInput<typeof createProductCategoryValidator>

/**
 * Valide les données de modification d'une catégorie.
 * isActive est obligatoire en édition : l'interface présente toujours le champ statut.
 */
export const updateProductCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    description: vine.string().trim().maxLength(500).nullable().optional(),
    isActive: vine.boolean(),
  })
)

export type UpdateProductCategoryInput = InferInput<typeof updateProductCategoryValidator>

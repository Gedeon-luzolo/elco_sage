import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

/**
 * Valide la création ou mise à jour d'un mouvement de stock (entrées uniquement).
 */
export const createStockMovementValidator = vine.create(
  vine.object({
    productId: vine.string().uuid(),
    date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Format YYYY-MM-DD
    entries: vine.number().min(0),
    unit: vine.enum(['base', 'packaging']), // 'base' = unité de base (feuilles), 'packaging' = conditionnement (rames)
  })
)

export type CreateStockMovementInput = Infer<typeof createStockMovementValidator>

/**
 * Valide la saisie du stock physique et des pertes en fin de journée.
 */
export const validatePhysicalStockValidator = vine.create(
  vine.object({
    productId: vine.string().uuid(),
    date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Format YYYY-MM-DD
    physicalStock: vine.number().min(0),
    physicalStockUnit: vine.enum(['base', 'packaging']), // Unité du stock physique
    losses: vine.number().min(0).nullable().optional(),
    lossesUnit: vine.enum(['base', 'packaging']).nullable().optional(), // Unité des pertes
  })
)

export type ValidatePhysicalStockInput = Infer<typeof validatePhysicalStockValidator>

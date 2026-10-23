import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'

/**
 * Valide les identifiants envoyes par la SPA pour obtenir un token.
 */
export const loginValidator = vine.create({
  email: vine.string().trim().email(),
  password: vine.string().minLength(1).maxLength(255),
})

export type LoginInput = InferInput<typeof loginValidator>

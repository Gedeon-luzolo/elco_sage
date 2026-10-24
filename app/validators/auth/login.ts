import vine from '@vinejs/vine'

/**
 * Valide les identifiants envoyés par la SPA pour obtenir un token.
 */
export const loginValidator = vine.create({
  email: vine.string().trim().email(),
  password: vine.string().minLength(1).maxLength(255),
})

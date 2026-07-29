import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'

/**
 * Valide le mot de passe envoye pour deverrouiller l'ecran idle.
 * Cette verification concerne un utilisateur deja connecte.
 * Elle ne remplace pas le login complet avec email et password.
 */
export const verifyPasswordValidator = vine.create({
  password: vine.string().minLength(1).maxLength(32),
})

export type VerifyPasswordInput = InferInput<typeof verifyPasswordValidator>

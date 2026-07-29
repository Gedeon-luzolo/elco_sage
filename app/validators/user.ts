import { UserRole, UserStatus } from '#models/user'
import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'

/**
 * Valide les donnees de creation utilisateur par le back-office.
 * Le role est obligatoire pour eviter les comptes ambigus.
 * Le statut reste optionnel et ACTIVE sera applique par le service.
 */
export const createUserValidator = vine.create({
  fullName: vine.string().nullable(),
  email: vine.string().email().maxLength(254).unique({ table: 'users', column: 'email' }),
  role: vine.enum(Object.values(UserRole)),
  status: vine.enum(Object.values(UserStatus)).optional(),
})

export type CreateUserInput = InferInput<typeof createUserValidator>

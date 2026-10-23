import { isManagementRole } from '#utils/user_role_utils'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Réserve une route de l'API aux profils de gestion (admin, directeur).
 * Doit être chaînée après apiAuth : un rôle insuffisant reçoit un 403 JSON.
 */
export default class ApiManagementMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // L'utilisateur est déjà authentifié par apiAuth, il ne reste qu'à contrôler son rôle
    if (!isManagementRole(ctx.auth.getUserOrFail().role)) {
      return ctx.response.forbidden({ message: 'Accès réservé à la direction.' })
    }

    return next()
  }
}

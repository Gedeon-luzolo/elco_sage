import { isManagementRole } from '#utils/user_role_utils'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Reserve une route de l'API aux profils de gestion (admin, directeur).
 * Doit etre chainee apres apiAuth : un role insuffisant recoit un 403 JSON.
 */
export default class ApiManagementMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!isManagementRole(ctx.auth.getUserOrFail().role)) {
      return ctx.response.forbidden({ message: 'Accès réservé à la direction.' })
    }

    return next()
  }
}

import { UserRole } from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const MANAGEMENT_ROLES = [UserRole.ADMIN, UserRole.DIRECTOR]

export default class ManagementAccessMiddleware {
  /**
   * Protege les pages reservees a la direction.
   * L'utilisateur doit deja etre authentifie avant ce middleware.
   * Les roles non autorises sont renvoyes proprement au login.
   */
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    // La route doit toujours etre chainee apres middleware.auth().
    if (!user) {
      return ctx.response.redirect().toRoute('session.create')
    }

    if (!MANAGEMENT_ROLES.includes(user.role)) {
      // On ferme la session pour eviter une boucle login -> home -> 403.
      await ctx.auth.use('web').logout()
      ctx.session.forget('error')

      return ctx.response.redirect().toRoute('session.create')
    }

    return next()
  }
}

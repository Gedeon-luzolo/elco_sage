import { isManagementRole } from '#utils/user_role_utils'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

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

    if (!isManagementRole(user.role)) {
      // On ferme la session pour eviter une boucle login -> home -> 403.
      await ctx.auth.use('web').logout()
      ctx.session.forget('error')

      return ctx.response.redirect().toRoute('session.create')
    }

    return next()
  }
}

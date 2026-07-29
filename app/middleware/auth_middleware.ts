import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  /**
   * Verifie la session sans flasher d'erreur systeme.
   * Une redirection vers login n'est pas une erreur utilisateur.
   * Evite le toast "Unauthorized access" sur la page de connexion.
   */
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    const guards = options.guards || [ctx.auth.defaultGuard]

    for (const guard of guards) {
      // check() hydrate auth.user si la session est valide.
      if (await ctx.auth.use(guard).check()) {
        return next()
      }
    }

    return ctx.response.redirect(this.redirectTo, true)
  }
}

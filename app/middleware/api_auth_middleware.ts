import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Authentifie les requetes de l'API par token Bearer.
 * Contrairement au middleware web, aucune redirection : un 401 JSON est renvoye
 * pour que la SPA decide quoi faire (ecran de login, file hors ligne).
 */
export default class ApiAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.authenticateUsing(['api'])

    return next()
  }
}

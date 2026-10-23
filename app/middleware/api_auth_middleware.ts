import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Authentifie les requêtes de l'API par token Bearer.
 * Aucune redirection : un 401 JSON est renvoyé pour que la SPA décide quoi faire
 * (écran de connexion, file d'attente hors ligne).
 */
export default class ApiAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Lève une erreur 401 si le token est absent, invalide ou expiré
    await ctx.auth.authenticateUsing(['api'])

    return next()
  }
}

import type { HttpContext } from '@adonisjs/core/http'

/**
 * Flashe un message d'erreur en session et redirige vers la page précédente.
 *
 * @param ctx Le contexte HTTP courant
 * @param error L'erreur interceptée
 * @param fallbackMessage Le message d'erreur par défaut si l'erreur n'a pas de message explicite
 */
export function handleControllerError(ctx: HttpContext, error: unknown, fallbackMessage: string) {
  // Utilise le message de l'erreur si disponible, sinon le message générique fourni par le controleur.
  const message = error instanceof Error ? error.message : fallbackMessage

  // Flash le message en session pour qu'il soit affiché sur la page suivante.
  ctx.session.flash('error', message)

  // Retourne à la page précédente pour conserver le contexte utilisateur.
  return ctx.response.redirect().back()
}

/**
 * Exécute une action de service de manière sécurisée en gérant le succès et les erreurs.
 *
 * @param ctx Le contexte HTTP courant
 * @param action La fonction de service à exécuter
 * @param options Messages de succès, d'erreur et URL de redirection
 */
export async function runAction<T>(
  ctx: HttpContext,
  action: () => Promise<T>,
  options: {
    successMessage?: string | ((result: T) => string)
    errorMessage: string
    redirectTo: string | ((result: T) => string)
  }
) {
  try {
    // Exécute l'action de service (create, update, delete, etc.).
    const result = await action()

    // Flash le message de succès uniquement s'il est fourni.
    if (options.successMessage) {
      // Supporte un message statique ou une fonction qui reçoit le résultat de l'action.
      const msg =
        typeof options.successMessage === 'function'
          ? options.successMessage(result)
          : options.successMessage

      ctx.session.flash('success', msg)
    }

    // Redirige vers l'URL précisée par le controleur appelant.
    const redirectTo =
      typeof options.redirectTo === 'function' ? options.redirectTo(result) : options.redirectTo

    return ctx.response.redirect().toPath(redirectTo)
  } catch (error) {
    // Délègue la gestion de l'erreur au handler centralisé.
    return handleControllerError(ctx, error, options.errorMessage)
  }
}

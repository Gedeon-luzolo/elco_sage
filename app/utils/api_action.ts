import type { HttpContext } from '@adonisjs/core/http'

/**
 * Équivalent JSON de runAction : les erreurs métier des services (Error simples)
 * deviennent un 422 avec leur message. Les exceptions Adonis (validation, 404, auth)
 * gardent leur traitement natif.
 */
export async function apiAction<T>(ctx: HttpContext, action: () => Promise<T>): Promise<T | void> {
  try {
    return await action()
  } catch (error) {
    // Les exceptions Adonis portent un code "E_..." et ont déjà leur réponse HTTP
    const code = (error as { code?: unknown }).code

    // Une erreur simple lancée par un service est un message destiné à l'utilisateur
    if (error instanceof Error && !(typeof code === 'string' && code.startsWith('E_'))) {
      return ctx.response.unprocessableEntity({ message: error.message }) as unknown as void
    }

    throw error
  }
}

import type { HttpContext } from '@adonisjs/core/http'

/**
 * Equivalent JSON de runAction : les erreurs metier des services (Error simples)
 * deviennent un 422 avec leur message. Les exceptions Adonis (validation, 404, auth)
 * gardent leur traitement natif.
 */
export async function apiAction<T>(ctx: HttpContext, action: () => Promise<T>): Promise<T | void> {
  try {
    return await action()
  } catch (error) {
    const code = (error as { code?: unknown }).code

    if (error instanceof Error && !(typeof code === 'string' && code.startsWith('E_'))) {
      return ctx.response.unprocessableEntity({ message: error.message }) as unknown as void
    }

    throw error
  }
}

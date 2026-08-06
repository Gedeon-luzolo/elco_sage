import type {} from '../../../.adonisjs/server/pages.d.ts'
import CashSessionService from '#services/sales/cash_session_service'
import CashSessionTransformer from '#transformers/cash_session_transformer'
import { runAction } from '#utils/error_handler'
import { closeCashSessionValidator } from '#validators/cash_session'
import type { HttpContext } from '@adonisjs/core/http'

const cashSessionService = new CashSessionService()

export default class CashSessionsController {
  /**
   * Affiche l'ecran d'ouverture de caisse.
   */
  async create({ auth, inertia }: HttpContext) {
    const actor = auth.getUserOrFail()

    // Si une session existe deja, la page propose simplement de continuer.
    const currentCashSession = await cashSessionService.getOpenSessionForUser(actor.id)

    return (inertia.render as any)('sales/cash_session_opening_page', {
      currentCashSession: CashSessionTransformer.transformNullable(currentCashSession),
    })
  }

  /**
   * Retourne les montants systeme uniquement au moment d'ouvrir le dialog de cloture.
   */
  async systemAmounts({ auth, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const currentCashSession = await cashSessionService.getOpenSessionForUser(actor.id)

    // Si aucune session n'est ouverte, on ne peut pas calculer les montants systeme.
    if (!currentCashSession) {
      return response.notFound({ message: "Aucune session de caisse ouverte n'a ete trouvee." })
    }

    // Calculer les montants systeme pour la session ouverte.
    return response.ok(await cashSessionService.computeSystemAmounts(currentCashSession))
  }

  /**
   * Ouvre une session de caisse pour l'utilisateur connecte.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    return runAction(ctx, () => cashSessionService.open(actor), {
      successMessage: 'Session de caisse ouverte avec succes.',
      errorMessage: "Impossible d'ouvrir la session de caisse.",
      redirectTo: '/sales',
    })
  }

  /**
   * Ferme la session de caisse ouverte de l'utilisateur connecte.
   */
  async close(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(closeCashSessionValidator)

    return runAction(ctx, () => cashSessionService.close(actor, payload), {
      successMessage: 'Session de caisse fermee avec succes.',
      errorMessage: 'Impossible de fermer la session de caisse.',
      redirectTo: '/sales/session/open',
    })
  }
}

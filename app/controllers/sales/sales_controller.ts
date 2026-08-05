import type {} from '../../../.adonisjs/server/pages.d.ts'
import CashSessionService from '#services/sales/cash_session_service'
import CashSessionTransformer from '#transformers/cash_session_transformer'
import type { HttpContext } from '@adonisjs/core/http'

const cashSessionService = new CashSessionService()

export default class SalesController {
  /**
   * Affiche la page principale du module vente.
   */
  async index({ auth, inertia }: HttpContext) {
    const actor = auth.getUserOrFail()

    // La premiere version pose le cadre des sessions avant la saisie des ventes.
    const currentCashSession = await cashSessionService.getOpenSessionForUser(actor.id)

    return (inertia.render as any)('sales/sales_page', {
      currentCashSession: CashSessionTransformer.transformNullable(currentCashSession),
    })
  }
}

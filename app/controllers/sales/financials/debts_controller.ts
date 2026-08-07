import type {} from '../../../../.adonisjs/server/pages.js'
import DebtService from '#services/sales/financials/debt_service'
import DebtTransformer from '#transformers/debt_transformer'
import type { HttpContext } from '@adonisjs/core/http'

const debtService = new DebtService()

export default class DebtsController {
  /**
   * Affiche les ventes à crédit avec leur reste à payer sur la période demandée.
   */
  async index({ inertia, request }: HttpContext) {
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')

    // Les dettes soldées sont exclues par défaut pour garder la page orientée action.
    const overview = await debtService.getOverview({
      startDate,
      endDate,
      includePaid: false,
    })

    return (inertia.render as any)('sales/debts_page', {
      debts: DebtTransformer.transform(overview.debts),
      stats: overview.stats,
      filters: {
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      },
    })
  }
}

import type {} from '../../../../.adonisjs/server/pages.js'
import DebtService from '#services/sales/financials/debt_service'
import DebtTransformer from '#transformers/debt_transformer'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class DebtsController {
  constructor(private debtService: DebtService) {}

  /**
   * Affiche les ventes à crédit avec leur reste à payer sur la période demandée.
   */
  async index({ inertia, request }: HttpContext) {
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')

    // Les dettes soldées sont exclues par défaut pour garder la page orientée action.
    const overview = await this.debtService.getOverview({
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

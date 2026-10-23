import DebtService from '#services/sales/financials/debt_service'
import DebtTransformer from '#transformers/debt_transformer'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiDebtsController {
  constructor(private debtService: DebtService) {}

  /**
   * Ventes à crédit avec leur reste à payer. Les dettes soldées sont exclues sauf `includePaid=true`.
   */
  async index({ request, serialize }: HttpContext) {
    // La période est optionnelle : sans dates, toutes les dettes sont listées
    const overview = await this.debtService.getOverview({
      startDate: request.input('startDate'),
      endDate: request.input('endDate'),
      includePaid: request.input('includePaid') === 'true',
    })

    return serialize({ debts: DebtTransformer.transform(overview.debts), stats: overview.stats })
  }
}

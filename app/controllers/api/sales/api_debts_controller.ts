import DebtService from '#services/sales/financials/debt_service'
import DebtTransformer from '#transformers/debt_transformer'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiDebtsController {
  constructor(private debtService: DebtService) {}

  /**
   * Ventes a credit avec leur reste a payer. Les dettes soldees sont exclues sauf `includePaid=true`.
   */
  async index({ request, serialize }: HttpContext) {
    const overview = await this.debtService.getOverview({
      startDate: request.input('startDate'),
      endDate: request.input('endDate'),
      includePaid: request.input('includePaid') === 'true',
    })

    return serialize({ debts: DebtTransformer.transform(overview.debts), stats: overview.stats })
  }
}

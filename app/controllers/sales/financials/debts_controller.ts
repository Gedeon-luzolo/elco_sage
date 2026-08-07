import type {} from '../../../../.adonisjs/server/pages.js'
import DebtService from '#services/sales/financials/debt_service'
import RecoveryService from '#services/sales/financials/recovery_service'
import DebtTransformer from '#transformers/debt_transformer'
import type { HttpContext } from '@adonisjs/core/http'

const debtService = new DebtService()
const recoveryService = new RecoveryService()

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

  /**
   * Affiche uniquement les dettes déjà soldées.
   */
  async recoveries({ inertia, request }: HttpContext) {
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')

    // Les dettes soldées sont récupérées pour cette vue de recouvrement.
    const overview = await recoveryService.getOverview({
      startDate,
      endDate,
    })

    // Retourne la liste et les statistiques au frontend pour affichage.
    return (inertia.render as any)('sales/recoveries_page', {
      debts: DebtTransformer.transform(overview.debts),
      stats: overview.stats,
      filters: {
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      },
    })
  }
}

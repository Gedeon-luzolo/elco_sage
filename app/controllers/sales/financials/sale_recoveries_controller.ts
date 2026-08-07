import type {} from '../../../../.adonisjs/server/pages.js'
import SaleRecoveryService from '#services/sales/financials/sale_recovery_service'
import RecoveryPaymentTransformer from '#transformers/recovery_payment_transformer'
import type { CreateSaleRecoveryInput } from '#types/sales'
import { runAction } from '#utils/error_handler'
import { createSaleRecoveryValidator } from '#validators/sale_recovery'
import type { HttpContext } from '@adonisjs/core/http'

const saleRecoveryService = new SaleRecoveryService()

// URL de redirection par défaut après recouvrement.
const REDIRECT_URL = '/sales'

export default class SaleRecoveriesController {
  /**
   * Affiche l'historique des paiements de dettes.
   */
  async overview({ inertia, request }: HttpContext) {
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')

    const overview = await saleRecoveryService.getOverview({
      startDate,
      endDate,
    })

    return (inertia.render as any)('sales/recoveries_page', {
      recoveries: RecoveryPaymentTransformer.transform(overview.recoveries),
      stats: overview.stats,
      filters: {
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      },
    })
  }

  /**
   * Enregistre un recouvrement sur une vente à crédit.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createSaleRecoveryValidator)
    const redirectTo = ctx.request.input('redirectTo', REDIRECT_URL)

    return runAction(
      ctx,
      () =>
        saleRecoveryService.create(actor, ctx.params.saleId, payload as CreateSaleRecoveryInput),
      {
        successMessage: 'Recouvrement enregistré avec succès.',
        errorMessage: "Impossible d'enregistrer ce recouvrement.",
        redirectTo,
      }
    )
  }
}

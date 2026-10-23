import SaleRecoveryService from '#services/sales/financials/sale_recovery_service'
import RecoveryPaymentTransformer from '#transformers/recovery_payment_transformer'
import type { CreateSaleRecoveryInput } from '#types/sales'
import { apiAction } from '#utils/api_action'
import { createSaleRecoveryValidator } from '#validators/sale_recovery'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiSaleRecoveriesController {
  constructor(private saleRecoveryService: SaleRecoveryService) {}

  /**
   * Historique des paiements de dettes sur la periode.
   */
  async index({ request, serialize }: HttpContext) {
    const overview = await this.saleRecoveryService.getOverview({
      startDate: request.input('startDate'),
      endDate: request.input('endDate'),
    })

    return serialize({
      recoveries: RecoveryPaymentTransformer.transform(overview.recoveries),
      stats: overview.stats,
    })
  }

  /**
   * Enregistre un recouvrement. Idempotent si `id` est fourni (rejeu hors ligne).
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createSaleRecoveryValidator)

    return apiAction(ctx, async () => {
      const recovery = await this.saleRecoveryService.create(
        actor,
        ctx.params.saleId,
        payload as CreateSaleRecoveryInput
      )

      return ctx.response.created(await ctx.serialize({ id: recovery.id }))
    })
  }
}

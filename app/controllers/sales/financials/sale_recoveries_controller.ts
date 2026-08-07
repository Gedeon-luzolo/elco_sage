import SaleRecoveryService from '#services/sales/financials/sale_recovery_service'
import SaleRecoveryTransformer from '#transformers/sale_recovery_transformer'
import type { CreateSaleRecoveryInput } from '#types/sales'
import { runAction } from '#utils/error_handler'
import { createSaleRecoveryValidator } from '#validators/sale_recovery'
import type { HttpContext } from '@adonisjs/core/http'

const saleRecoveryService = new SaleRecoveryService()

// URL de redirection par defaut apres recouvrement.
const REDIRECT_URL = '/sales'

export default class SaleRecoveriesController {
  /**
   * Liste les recouvrements d'une vente.
   */
  async index({ params, response }: HttpContext) {
    const recoveries = await saleRecoveryService.findBySale(params.saleId)

    return response.ok({
      recoveries: SaleRecoveryTransformer.transform(recoveries),
    })
  }

  /**
   * Enregistre un recouvrement sur une vente a credit.
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
        successMessage: 'Recouvrement enregistre avec succes.',
        errorMessage: "Impossible d'enregistrer ce recouvrement.",
        redirectTo,
      }
    )
  }
}

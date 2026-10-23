import { SaleStatus } from '#models/sale'
import SaleService from '#services/sales/sale_service'
import SaleTransformer from '#transformers/sale_transformer'
import type { CreateSaleInput } from '#types/sales'
import { apiAction } from '#utils/api_action'
import { isManagementRole } from '#utils/user_role_utils'
import { createSaleValidator } from '#validators/sale'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiSalesController {
  constructor(private saleService: SaleService) {}

  /**
   * Historique des ventes (toutes caisses), filtrable par date, numéro et statut.
   */
  async index({ request, serialize }: HttpContext) {
    const status = request.input('status')

    // Un statut inconnu est ignoré plutôt que de provoquer une erreur
    const sales = await this.saleService.findAllBatch({
      facturationDate: request.input('facturationDate') || undefined,
      additionNumber: request.input('additionNumber') || undefined,
      status: Object.values(SaleStatus).includes(status) ? status : undefined,
    })

    return serialize(SaleTransformer.transform(sales))
  }

  /**
   * Crée une vente. Idempotent si `id` est fourni (rejeu d'une vente faite hors ligne).
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createSaleValidator)

    return apiAction(ctx, async () => {
      // Le service gère la validation métier, le stock et l'idempotence
      const sale = await this.saleService.create(actor, payload as CreateSaleInput)

      return ctx.response.created(await ctx.serialize(SaleTransformer.transformSingle(sale)))
    })
  }

  /**
   * Annule une vente (profils de gestion uniquement).
   */
  async cancel(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    // Seule la direction peut annuler une vente
    if (!isManagementRole(actor.role)) {
      return ctx.response.forbidden({
        message: 'Seuls les profils de gestion peuvent annuler une vente.',
      })
    }

    return apiAction(ctx, async () => {
      const sale = await this.saleService.cancel(actor, ctx.params.id)

      return ctx.serialize(SaleTransformer.transformSingle(sale))
    })
  }
}

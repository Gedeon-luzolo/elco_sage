import CustomerService from '#services/customers/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'
import { apiAction } from '#utils/api_action'
import { createCustomerValidator, updateCustomerValidator } from '#validators/customer'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiCustomersController {
  constructor(private customerService: CustomerService) {}

  /**
   * Liste des clients avec leurs statistiques.
   */
  async index({ serialize }: HttpContext) {
    const overview = await this.customerService.getOverview()

    return serialize({
      customers: CustomerTransformer.transform(overview.customers),
      stats: overview.stats,
    })
  }

  /**
   * Clients actifs, utilises comme donnees de reference hors ligne par la vente.
   */
  async activeForSale({ serialize }: HttpContext) {
    return serialize(
      CustomerTransformer.transform(await this.customerService.getActiveCustomersForSale())
    )
  }

  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createCustomerValidator)

    return apiAction(ctx, async () => {
      const customer = await this.customerService.create(actor, payload)

      return ctx.response.created(
        await ctx.serialize(CustomerTransformer.transformSingle(customer))
      )
    })
  }

  async update(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(updateCustomerValidator)

    return apiAction(ctx, async () => {
      const customer = await this.customerService.update(actor, ctx.params.id, payload)

      return ctx.serialize(CustomerTransformer.transformSingle(customer))
    })
  }
}

import type {} from '../../../.adonisjs/server/pages.d.ts'
import CustomerService from '#services/customers/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'
import { runAction } from '#utils/error_handler'
import { createCustomerValidator, updateCustomerValidator } from '#validators/customer'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

// URL de redirection commune apres toute mutation reussie.
const REDIRECT_URL = '/customers'

@inject()
export default class CustomersController {
  constructor(private customerService: CustomerService) {}

  /**
   * Affiche la liste des clients.
   */
  async index({ inertia }: HttpContext) {
    const overview = await this.customerService.getOverview()

    return (inertia.render as any)('customers/customers_page', {
      customers: CustomerTransformer.transform(overview.customers),
      stats: overview.stats,
    })
  }

  /**
   * Cree un nouveau client.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createCustomerValidator)

    return runAction(ctx, () => this.customerService.create(actor, payload), {
      successMessage: (customer) => `"${customer.fullName}" crée avec succes.`,
      errorMessage: 'Impossible de creer ce client.',
      redirectTo: REDIRECT_URL,
    })
  }

  /**
   * Met a jour un client existant.
   */
  async update(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(updateCustomerValidator)

    return runAction(ctx, () => this.customerService.update(actor, ctx.params.id, payload), {
      successMessage: 'Client mis a jour.',
      errorMessage: 'Impossible de mettre a jour ce client.',
      redirectTo: REDIRECT_URL,
    })
  }
}

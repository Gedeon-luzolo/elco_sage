import type {} from '../../../.adonisjs/server/pages.d.ts'
import CustomerService from '#services/customers/customer_service'
import CashSessionService from '#services/sales/cash_session_service'
import ProductServiceService from '#services/products/product_service_service'
import UserService from '#services/users/user_service'
import CashSessionTransformer from '#transformers/cash_session_transformer'
import CustomerTransformer from '#transformers/customer_transformer'
import ProductServiceTransformer from '#transformers/product_service_transformer'
import SaleTransformer from '#transformers/sale_transformer'
import type { CreateSaleInput } from '#types/sales'
import { runAction } from '#utils/error_handler'
import { createSaleValidator } from '#validators/sale'
import UserTransformer from '#transformers/user_transformer'
import SaleService from '#services/sales/sale_service'
import type { HttpContext } from '@adonisjs/core/http'

const cashSessionService = new CashSessionService()
const productServiceService = new ProductServiceService()
const userService = new UserService()
const customerService = new CustomerService()
const saleService = new SaleService()

// URL de redirection commune apres mutation de vente.
const REDIRECT_URL = '/sales'

export default class SalesController {
  /**
   * Affiche le formulaire de creation d'une vente.
   */
  async create({ auth, inertia }: HttpContext) {
    const actor = auth.getUserOrFail()

    // Le formulaire utilise les memes listes que la page de lecture.
    const currentCashSession = await cashSessionService.getOpenSessionForUser(actor.id)
    const [saleServices, operators, customers] = await Promise.all([
      productServiceService.getActiveServicesForSale(),
      userService.getActiveOperatorsForSale(),
      customerService.getActiveCustomersForSale(),
    ])

    return (inertia.render as any)('sales/sale_create_page', {
      currentCashSession: CashSessionTransformer.transformNullable(currentCashSession),
      saleServices: ProductServiceTransformer.transform(saleServices),
      operators: UserTransformer.transform(operators),
      customers: CustomerTransformer.transform(customers),
    })
  }

  /**
   * Affiche la page principale du module vente.
   */
  async index({ auth, inertia }: HttpContext) {
    const actor = auth.getUserOrFail()

    // La premiere version pose le cadre des sessions avant la saisie des ventes.
    const currentCashSession = await cashSessionService.getOpenSessionForUser(actor.id)

    // Les listes de services, operateurs et clients sont necessaires pour le formulaire de creation.
    const [saleServices, operators, customers, currentSessionSales] = await Promise.all([
      productServiceService.getActiveServicesForSale(),
      userService.getActiveOperatorsForSale(),
      customerService.getActiveCustomersForSale(),
      currentCashSession ? saleService.findByCashSession(currentCashSession.id) : [],
    ])

    return (inertia.render as any)('sales/sales_page', {
      currentCashSession: CashSessionTransformer.transformNullable(currentCashSession),
      saleServices: ProductServiceTransformer.transform(saleServices),
      operators: UserTransformer.transform(operators),
      customers: CustomerTransformer.transform(customers),
      sales: SaleTransformer.transform(currentSessionSales),
    })
  }

  /**
   * Retourne le detail d'une vente.
   */
  async show({ params, response }: HttpContext) {
    const sale = await saleService.findById(params.id)

    return response.ok({
      sale: SaleTransformer.transformSingle(sale),
    })
  }

  /**
   * Enregistre une vente avec ses lignes.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createSaleValidator)

    return runAction(ctx, () => saleService.create(actor, payload as CreateSaleInput), {
      successMessage: 'Vente enregistree avec succes.',
      errorMessage: "Impossible d'enregistrer cette vente.",
      redirectTo: REDIRECT_URL,
    })
  }

  /**
   * Annule une vente existante sans la supprimer.
   */
  async cancel(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    return runAction(ctx, () => saleService.cancel(actor, ctx.params.id), {
      successMessage: 'Vente annulee avec succes.',
      errorMessage: "Impossible d'annuler cette vente.",
      redirectTo: REDIRECT_URL,
    })
  }
}

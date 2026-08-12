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
import { dateTimeToDateKey, todayDateKey } from '#utils/date_utils'
import { isManagementRole } from '#utils/user_role_utils'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

// URL de redirection commune apres mutation de vente.
const REDIRECT_URL = '/sales'

@inject()
export default class SalesController {
  constructor(
    private cashSessionService: CashSessionService,
    private productServiceService: ProductServiceService,
    private userService: UserService,
    private customerService: CustomerService,
    private saleService: SaleService
  ) {}

  /**
   * Affiche le formulaire de creation d'une vente.
   */
  async create({ auth, inertia }: HttpContext) {
    const actor = auth.getUserOrFail()

    // Le formulaire utilise les memes listes que la page de lecture.
    const currentCashSession = await this.cashSessionService.getOpenSessionForUser(actor.id)
    const stockDate = currentCashSession
      ? dateTimeToDateKey(currentCashSession.openedAt)
      : undefined
    const [saleServices, operators, customers] = await Promise.all([
      this.productServiceService.getActiveServicesForSale(stockDate),
      this.userService.getActiveOperatorsForSale(),
      this.customerService.getActiveCustomersForSale(),
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

    // Ce flag pilote uniquement la lecture: un manager consulte les ventes du jour.
    const isManagementUser = isManagementRole(actor.role)
    // Les caissiers lisent leur caisse; les managers lisent les ventes de la journee.
    const currentCashSession = await this.cashSessionService.getOpenSessionForUser(actor.id)

    // Le stock affiché suit la session du caissier si elle existe, sinon la journée métier courante.
    const stockDate = currentCashSession
      ? dateTimeToDateKey(currentCashSession.openedAt)
      : todayDateKey()
    let visibleSalesPromise

    // Si l'utilisateur a une caisse ouverte, sa session devient la vue prioritaire.
    if (currentCashSession) {
      visibleSalesPromise = this.saleService.findByCashSession(currentCashSession.id)
      // Sans caisse ouverte, les managers auditent les ventes du jour.
    } else if (isManagementUser) {
      visibleSalesPromise = this.saleService.findByBusinessDate(todayDateKey())
      // Sans session ouverte, un caissier n'a aucune vente courante à afficher.
    } else {
      visibleSalesPromise = Promise.resolve([])
    }

    // Les listes annexes restent chargées en parallèle avec les ventes visibles.
    const [saleServices, operators, customers, visibleSales] = await Promise.all([
      this.productServiceService.getActiveServicesForSale(stockDate),
      this.userService.getActiveOperatorsForSale(),
      this.customerService.getActiveCustomersForSale(),
      visibleSalesPromise,
    ])

    return (inertia.render as any)('sales/sales_page', {
      currentCashSession: CashSessionTransformer.transformNullable(currentCashSession),
      saleServices: ProductServiceTransformer.transform(saleServices),
      operators: UserTransformer.transform(operators),
      customers: CustomerTransformer.transform(customers),
      sales: SaleTransformer.transform(visibleSales),
    })
  }

  /**
   * Retourne le detail d'une vente.
   */
  async show({ params, response }: HttpContext) {
    const sale = await this.saleService.findById(params.id)

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

    return runAction(ctx, () => this.saleService.create(actor, payload as CreateSaleInput), {
      successMessage: 'Vente enregistree avec succes.',
      errorMessage: "Impossible d'enregistrer cette vente.",
      redirectTo: (sale) => `${REDIRECT_URL}?printSaleId=${sale.id}`,
    })
  }

  /**
   * Annule une vente existante sans la supprimer.
   */
  async cancel(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    return runAction(
      ctx,
      () => {
        if (!isManagementRole(actor.role)) {
          throw new Error('Seuls les profils de gestion peuvent annuler une vente.')
        }

        return this.saleService.cancel(actor, ctx.params.id)
      },
      {
        successMessage: 'Vente annulee avec succes.',
        errorMessage: "Impossible d'annuler cette vente.",
        redirectTo: REDIRECT_URL,
      }
    )
  }
}

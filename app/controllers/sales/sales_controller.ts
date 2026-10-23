import type {} from '../../../.adonisjs/server/pages.d.ts'
import CustomerService from '#services/customers/customer_service'
import CashSessionService from '#services/sales/cash_session_service'
import ProductServiceService from '#services/products/product_service_service'
import UserService from '#services/users/user_service'
import CashSessionTransformer from '#transformers/cash_session_transformer'
import CustomerTransformer from '#transformers/customer_transformer'
import ProductServiceTransformer from '#transformers/product_service_transformer'
import SaleTransformer from '#transformers/sale_transformer'
import { SaleStatus } from '#models/sale'
import type { CreateSaleInput } from '#types/sales'
import { runAction } from '#utils/error_handler'
import { createSaleValidator } from '#validators/sale'
import UserTransformer from '#transformers/user_transformer'
import SaleReportService from '#services/sales/sale_report_service'
import SaleService from '#services/sales/sale_service'
import { dateTimeToDateKey } from '#utils/date_utils'
import { isManagementRole } from '#utils/user_role_utils'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

// URL de redirection commune après mutation de vente : /sales n'est qu'une
// page de navigation, l'historique est l'endroit qui liste réellement les ventes.
const REDIRECT_URL = '/sales/history'

// Après une vente réussie, on reste sur le formulaire pour enchaîner les ventes.
const CREATE_URL = '/sales/create'

@inject()
export default class SalesController {
  constructor(
    private cashSessionService: CashSessionService,
    private productServiceService: ProductServiceService,
    private userService: UserService,
    private customerService: CustomerService,
    private saleService: SaleService,
    private saleReportService: SaleReportService
  ) {}

  /**
   * Affiche le formulaire de création d'une vente.
   */
  async create({ auth, inertia, request }: HttpContext) {
    const actor = auth.getUserOrFail()
    const printSaleId = request.input('printSaleId')

    // Le formulaire utilise les mêmes listes que la page de lecture.
    const currentCashSession = await this.cashSessionService.getOpenSessionForUser(actor.id)
    const stockDate = currentCashSession
      ? dateTimeToDateKey(currentCashSession.openedAt)
      : undefined
    const [saleServices, operators, customers, printSale] = await Promise.all([
      this.productServiceService.getActiveServicesForSale(stockDate),
      this.userService.getActiveOperatorsForSale(),
      this.customerService.getActiveCustomersForSale(),
      // La vente qui vient d'être enregistrée est rechargée pour imprimer son ticket.
      printSaleId ? this.saleService.findById(printSaleId) : null,
    ])

    return (inertia.render as any)('sales/sale_create_page', {
      currentCashSession: CashSessionTransformer.transformNullable(currentCashSession),
      saleServices: ProductServiceTransformer.transform(saleServices),
      operators: UserTransformer.transform(operators),
      customers: CustomerTransformer.transform(customers),
      printSale: printSale ? SaleTransformer.transformSingle(printSale) : null,
    })
  }

  /**
   * Affiche la page de navigation du module vente.
   * Les listes de ventes vivent desormais dans l'historique (/sales/history).
   */
  async index({ auth, inertia }: HttpContext) {
    const actor = auth.getUserOrFail()
    const currentCashSession = await this.cashSessionService.getOpenSessionForUser(actor.id)

    // Le résumé cash/dettes/recouvrements réutilise les totaux du rapport de session.
    const report = currentCashSession
      ? await this.saleReportService.getSessionReport(actor, currentCashSession.id)
      : null

    return (inertia.render as any)('sales/sales_page', {
      currentCashSession: CashSessionTransformer.transformNullable(currentCashSession),
      sessionTotals: report?.totals ?? null,
    })
  }

  /**
   * Affiche l'historique des ventes, toutes caisses et journées confondues.
   */
  async history({ inertia, request }: HttpContext) {
    const facturationDate = request.input('facturationDate')
    const additionNumber = request.input('additionNumber')
    const status = this.normalizeSaleStatus(request.input('status'))

    const sales = await this.saleService.findAllBatch({
      facturationDate: facturationDate || undefined,
      additionNumber: additionNumber || undefined,
      status,
    })

    return (inertia.render as any)('sales/sales_history_page', {
      sales: SaleTransformer.transform(sales),
      filters: {
        facturationDate: facturationDate ?? null,
        additionNumber: additionNumber ?? null,
        status: status ?? 'ALL',
      },
    })
  }

  // Ignore un statut inconnu pour éviter une erreur sur une URL modifiée à la main.
  private normalizeSaleStatus(status?: string) {
    if (!status || status === 'ALL') {
      return undefined
    }

    return Object.values(SaleStatus).includes(status as SaleStatus) ? status : undefined
  }

  /**
   * Retourne le détail d'une vente.
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
      successMessage: 'Vente enregistrée avec succès.',
      errorMessage: "Impossible d'enregistrer cette vente.",
      redirectTo: (sale) => `${CREATE_URL}?printSaleId=${sale.id}`,
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
        successMessage: 'Vente annulée avec succès.',
        errorMessage: "Impossible d'annuler cette vente.",
        redirectTo: REDIRECT_URL,
      }
    )
  }
}

import AdditionNumberService from '#services/sales/addition_number_service'
import CashSessionService from '#services/sales/cash_session_service'
import SaleReportService from '#services/sales/sale_report_service'
import CashSessionTransformer from '#transformers/cash_session_transformer'
import SaleTransformer from '#transformers/sale_transformer'
import { apiAction } from '#utils/api_action'
import { closeCashSessionValidator } from '#validators/cash_session'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiCashSessionsController {
  constructor(
    private cashSessionService: CashSessionService,
    private saleReportService: SaleReportService,
    private additionNumberService: AdditionNumberService
  ) {}

  /**
   * Liste les sessions visibles par l'utilisateur (filtrables par periode).
   */
  async index({ auth, request, serialize }: HttpContext) {
    const sessions = await this.cashSessionService.findVisibleSessions(auth.getUserOrFail(), {
      startDate: request.input('startDate'),
      endDate: request.input('endDate'),
    })

    return serialize(CashSessionTransformer.transform(sessions))
  }

  /**
   * Session ouverte de l'utilisateur, ou null : la SPA en deduit si la vente est possible.
   */
  async current({ auth, serialize }: HttpContext) {
    const session = await this.cashSessionService.getOpenSessionForUser(auth.getUserOrFail().id)

    return serialize(CashSessionTransformer.transformNullable(session))
  }

  /**
   * Detail d'une session : rapport avec ventes et totaux.
   */
  async show({ auth, params, serialize }: HttpContext) {
    const report = await this.saleReportService.getSessionReport(auth.getUserOrFail(), params.id)

    return serialize({
      session: CashSessionTransformer.transformSingle(report.session),
      sales: SaleTransformer.transform(report.sales),
      totals: report.totals,
    })
  }

  /**
   * Ouvre la session de caisse et reserve une premiere plage de numeros d'addition.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    return apiAction(ctx, async () => {
      const session = await this.cashSessionService.open(actor)
      const blocks = await this.additionNumberService.listBlocks(session.id)

      if (blocks.length === 0) {
        blocks.push(await this.additionNumberService.reserveBlock(session.id))
      }

      return ctx.response.created(
        await ctx.serialize({
          session: CashSessionTransformer.transformSingle(session),
          additionNumberBlocks: blocks,
        })
      )
    })
  }

  /**
   * Montants systeme affiches dans le dialogue de cloture.
   */
  async systemAmounts({ auth, response, serialize }: HttpContext) {
    const session = await this.cashSessionService.getOpenSessionForUser(auth.getUserOrFail().id)

    if (!session) {
      return response.notFound({ message: "Aucune session de caisse ouverte n'a ete trouvee." })
    }

    return serialize(await this.cashSessionService.computeSystemAmounts(session))
  }

  /**
   * Ferme la session ouverte de l'utilisateur.
   */
  async close(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(closeCashSessionValidator)

    return apiAction(ctx, async () => {
      const session = await this.cashSessionService.close(actor, payload)

      return ctx.serialize(CashSessionTransformer.transformSingle(session))
    })
  }
}

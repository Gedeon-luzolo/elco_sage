import AdditionNumberService from '#services/sales/addition_number_service'
import CashSessionService from '#services/sales/cash_session_service'
import SaleReportService from '#services/sales/sale_report_service'
import CashSessionTransformer from '#transformers/cash_session_transformer'
import SaleTransformer from '#transformers/sale_transformer'
import { apiAction } from '#utils/api_action'
import { closeCashSessionValidator } from '#validators/cash_session'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

const NO_OPEN_SESSION_MESSAGE = "Aucune session de caisse ouverte n'a été trouvée."

@inject()
export default class ApiCashSessionsController {
  constructor(
    private cashSessionService: CashSessionService,
    private saleReportService: SaleReportService,
    private additionNumberService: AdditionNumberService
  ) {}

  /**
   * Liste les sessions de caisse, partagées par tous (filtrables par période).
   */
  async index({ request, serialize }: HttpContext) {
    const sessions = await this.cashSessionService.findSessions({
      startDate: request.input('startDate'),
      endDate: request.input('endDate'),
    })

    return serialize(CashSessionTransformer.transform(sessions))
  }

  /**
   * Session ouverte (la même pour tous), ou null : la SPA en déduit si la vente est possible.
   */
  async current({ serialize }: HttpContext) {
    const session = await this.cashSessionService.getOpenSession()

    return serialize(CashSessionTransformer.transformNullable(session))
  }

  /**
   * Détail d'une session : rapport avec ventes et totaux.
   */
  async show({ params, serialize }: HttpContext) {
    const report = await this.saleReportService.getSessionReport(params.id)

    return serialize({
      session: CashSessionTransformer.transformSingle(report.session),
      sales: SaleTransformer.transform(report.sales),
      totals: report.totals,
    })
  }

  /**
   * Ouvre la session de caisse (refusé si une autre est encore ouverte) et réserve
   * une première plage de numéros d'addition à l'utilisateur.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    return apiAction(ctx, async () => {
      const session = await this.cashSessionService.open(actor)

      // Chaque utilisateur a ses propres plages : celui qui ouvre reçoit la première
      await this.additionNumberService.reserveBlock(session.id, actor.id)

      return ctx.response.created(
        await ctx.serialize({
          session: CashSessionTransformer.transformSingle(session),
          additionNumbers: await this.additionNumberState(session.id, actor.id),
        })
      )
    })
  }

  /**
   * Montants système affichés dans le dialogue de clôture.
   */
  async systemAmounts({ response, serialize }: HttpContext) {
    const session = await this.cashSessionService.getOpenSession()

    // Sans session ouverte, il n'y a rien à calculer
    if (!session) {
      return response.notFound({ message: NO_OPEN_SESSION_MESSAGE })
    }

    return serialize(await this.cashSessionService.computeSystemAmounts(session))
  }

  /**
   * Ferme la session ouverte : n'importe quel utilisateur peut le faire.
   */
  async close(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(closeCashSessionValidator)

    return apiAction(ctx, async () => {
      const session = await this.cashSessionService.close(actor, payload)

      return ctx.serialize(CashSessionTransformer.transformSingle(session))
    })
  }

  /**
   * Plages de numéros réservées à l'utilisateur pour la session ouverte et dernier numéro utilisé.
   */
  async additionNumbers({ auth, response, serialize }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const session = await this.cashSessionService.getOpenSession()

    if (!session) {
      return response.notFound({ message: NO_OPEN_SESSION_MESSAGE })
    }

    return serialize(await this.additionNumberState(session.id, userId))
  }

  /**
   * Réserve une nouvelle plage à l'utilisateur quand la précédente est presque consommée.
   */
  async reserveAdditionNumbers({ auth, response, serialize }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const session = await this.cashSessionService.getOpenSession()

    if (!session) {
      return response.notFound({ message: NO_OPEN_SESSION_MESSAGE })
    }

    // Nouvelle plage, puis état complet renvoyé au client
    await this.additionNumberService.reserveBlock(session.id, userId)

    return response.created(await serialize(await this.additionNumberState(session.id, userId)))
  }

  // État de la numérotation d'un utilisateur dans une session : ses plages et son dernier numéro utilisé.
  private async additionNumberState(cashSessionId: string, userId: string) {
    return {
      blocks: await this.additionNumberService.listBlocks(cashSessionId, userId),
      lastUsedNumber: await this.additionNumberService.lastUsedNumber(cashSessionId, userId),
    }
  }
}

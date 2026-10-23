import StockMovementService from '#services/stock/stock_movement_service'
import { apiAction } from '#utils/api_action'
import { todayDateKey } from '#utils/date_utils'
import {
  createStockMovementValidator,
  validatePhysicalStockValidator,
} from '#validators/stock_movement'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiStockMovementsController {
  constructor(private stockMovementService: StockMovementService) {}

  /**
   * Stock journalier (par defaut celui du jour).
   */
  async index(ctx: HttpContext) {
    const date = ctx.request.input('date', todayDateKey())

    return apiAction(ctx, async () =>
      ctx.serialize(await this.stockMovementService.getDailyStock({ date }))
    )
  }

  /**
   * Cree ou complete un mouvement (entrees).
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createStockMovementValidator)

    return apiAction(ctx, async () => {
      await this.stockMovementService.createOrUpdate(actor, payload)

      return ctx.response.noContent()
    })
  }

  /**
   * Corrige les entrees d'un mouvement.
   */
  async update(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createStockMovementValidator)

    return apiAction(ctx, async () => {
      await this.stockMovementService.updateEntries(actor, ctx.params.id, payload)

      return ctx.response.noContent()
    })
  }

  /**
   * Valide le stock physique et les pertes d'un produit.
   */
  async validatePhysical(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(validatePhysicalStockValidator)

    return apiAction(ctx, async () => {
      await this.stockMovementService.validatePhysicalStock(actor, payload)

      return ctx.response.noContent()
    })
  }

  /**
   * Corrige le stock physique et les pertes d'un mouvement.
   */
  async updatePhysical(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(validatePhysicalStockValidator)

    return apiAction(ctx, async () => {
      await this.stockMovementService.updatePhysicalStock(actor, ctx.params.id, payload)

      return ctx.response.noContent()
    })
  }
}

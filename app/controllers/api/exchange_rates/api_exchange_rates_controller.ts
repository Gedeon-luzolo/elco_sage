import ExchangeRateService from '#services/exchange_rates/exchange_rate_service'
import ExchangeRateTransformer from '#transformers/exchange_rate_transformer'
import { apiAction } from '#utils/api_action'
import { createExchangeRateValidator } from '#validators/exchange_rate'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiExchangeRatesController {
  constructor(private exchangeRateService: ExchangeRateService) {}

  /**
   * Historique des taux (le plus recent en premier = taux courant).
   */
  async index({ request, serialize }: HttpContext) {
    const limit = Number(request.input('limit', 20))
    const rates = await this.exchangeRateService.getHistory(limit)

    return serialize(ExchangeRateTransformer.transform(rates).useVariant('toHistory'))
  }

  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createExchangeRateValidator)

    return apiAction(ctx, async () => {
      await this.exchangeRateService.create(actor, payload)

      return ctx.response.noContent()
    })
  }
}

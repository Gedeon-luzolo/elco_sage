import ExchangeRateService from '#services/exchange_rates/exchange_rate_service'
import { apiAction } from '#utils/api_action'
import { createExchangeRateValidator } from '#validators/exchange_rate'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiExchangeRatesController {
  constructor(private exchangeRateService: ExchangeRateService) {}

  /**
   * Historique des taux (le plus récent en premier = taux courant).
   */
  async index({ request, serialize }: HttpContext) {
    // Nombre de lignes demandé, 20 par défaut
    const limit = Number(request.input('limit', 20))
    const rates = await this.exchangeRateService.getHistory(limit)

    return serialize(rates)
  }

  /**
   * Ajoute un taux : l'historique est conservé et le dernier devient le taux courant.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createExchangeRateValidator)

    return apiAction(ctx, async () => {
      // Le service journalise le changement et vide les caches dépendants
      await this.exchangeRateService.create(actor, payload)

      return ctx.response.noContent()
    })
  }
}

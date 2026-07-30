import ExchangeRateService from '#services/exchange_rates/exchange_rate_service'
import ExchangeRateTransformer from '#transformers/exchange_rate_transformer'
import { createExchangeRateValidator } from '#validators/exchange_rate'
import type { HttpContext } from '@adonisjs/core/http'

const exchangeRateService = new ExchangeRateService()

export default class ExchangeRatesController {
  /**
   * Cree une nouvelle ligne de taux.
   * Le service garde l'historique et journalise l'action.
   */
  async store({ request, auth, response, session }: HttpContext) {
    const actor = auth.user

    if (!actor) {
      return response.redirect().toRoute('session.create')
    }

    // Validation du payload
    const payload = await request.validateUsing(createExchangeRateValidator)

    try {
      // Creation du taux
      const exchangeRate = await exchangeRateService.create(actor, payload)

      /// Tranfomer le payload pour afffuchage
      return response.created({
        exchangeRate: ExchangeRateTransformer.transform(exchangeRate),
      })
    } catch (error) {
      session.flash('error', error instanceof Error ? error.message : 'Creation du taux impossible')
      return response.redirect().back()
    }
  }
}

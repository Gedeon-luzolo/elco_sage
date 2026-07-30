import ExchangeRateService from '#services/exchange_rates/exchange_rate_service'
import ExchangeRateTransformer from '#transformers/exchange_rate_transformer'
import { createExchangeRateValidator } from '#validators/exchange_rate'
import type { HttpContext } from '@adonisjs/core/http'

const exchangeRateService = new ExchangeRateService()

export default class ExchangeRatesController {
  // Affiche le taux courant et les vingt dernieres modifications.
  async getExchangeRates({ inertia }: HttpContext) {
    const exchangeRates = await exchangeRateService.getHistory(20)

    return inertia.render('rates/rates_page', {
      exchangeRates: ExchangeRateTransformer.transform(exchangeRates).useVariant('toHistory'),
    })
  }

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
      await exchangeRateService.create(actor, payload)

      session.flash('success', 'Taux de change mis a jour')
      return response.redirect().toRoute('exchange_rates.get')
    } catch (error) {
      session.flash('error', error instanceof Error ? error.message : 'Creation du taux impossible')
      return response.redirect().back()
    }
  }
}

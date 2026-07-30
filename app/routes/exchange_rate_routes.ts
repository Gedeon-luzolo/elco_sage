import router from '@adonisjs/core/services/router'

const ExchangeRatesController = () =>
  import('#controllers/exchange_rates/exchange_rates_controller')

// Regroupe les routes des taux de change.
export function registerExchangeRateRoutes() {
  router.get('rates', [ExchangeRatesController, 'getExchangeRates']).as('exchange_rates.get')
  router.post('rates', [ExchangeRatesController, 'store']).as('exchange_rates.store')
}

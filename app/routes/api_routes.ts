import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ApiSessionController = () => import('#controllers/api/auth/api_session_controller')
const ApiCashSessionsController = () =>
  import('#controllers/api/sales/api_cash_sessions_controller')
const ApiSalesController = () => import('#controllers/api/sales/api_sales_controller')
const ApiDebtsController = () => import('#controllers/api/sales/api_debts_controller')
const ApiSaleRecoveriesController = () =>
  import('#controllers/api/sales/api_sale_recoveries_controller')
const ApiStockMovementsController = () =>
  import('#controllers/api/stock/api_stock_movements_controller')
const ApiCustomersController = () => import('#controllers/api/customers/api_customers_controller')
const ApiProductServicesController = () =>
  import('#controllers/api/products/api_product_services_controller')
const ApiOperatorsController = () => import('#controllers/api/users/api_operators_controller')
const ApiExchangeRatesController = () =>
  import('#controllers/api/exchange_rates/api_exchange_rates_controller')

/**
 * Routes JSON consommees par la SPA (dossier web/).
 * Elles cohabitent avec les routes Inertia le temps de la migration.
 */
export function registerApiRoutes() {
  router
    .group(() => {
      router.post('auth/login', [ApiSessionController, 'login'])

      router
        .group(() => {
          router.get('auth/me', [ApiSessionController, 'me'])
          router.post('auth/verify-password', [ApiSessionController, 'verifyPassword'])
          router.post('auth/logout', [ApiSessionController, 'logout'])

          // Donnees de reference (mises en cache hors ligne par la SPA).
          router.get('operators', [ApiOperatorsController, 'index'])
          router.get('product-services/active-for-sale', [
            ApiProductServicesController,
            'activeForSale',
          ])
          router.get('exchange-rates', [ApiExchangeRatesController, 'index'])
          router.get('customers', [ApiCustomersController, 'index'])
          router.get('customers/active-for-sale', [ApiCustomersController, 'activeForSale'])
          router.post('customers', [ApiCustomersController, 'store'])
          router.put('customers/:id', [ApiCustomersController, 'update'])

          // Sessions de caisse (routes fixes declarees avant :id).
          router.get('cash-sessions', [ApiCashSessionsController, 'index'])
          router.get('cash-sessions/current', [ApiCashSessionsController, 'current'])
          router.get('cash-sessions/current/system-amounts', [
            ApiCashSessionsController,
            'systemAmounts',
          ])
          router.get('cash-sessions/current/addition-numbers', [
            ApiCashSessionsController,
            'additionNumbers',
          ])
          router.post('cash-sessions/current/addition-numbers', [
            ApiCashSessionsController,
            'reserveAdditionNumbers',
          ])
          router.post('cash-sessions/close', [ApiCashSessionsController, 'close'])
          router.post('cash-sessions', [ApiCashSessionsController, 'store'])
          router.get('cash-sessions/:id', [ApiCashSessionsController, 'show'])

          // Ventes, dettes et recouvrements.
          router.get('sales', [ApiSalesController, 'index'])
          router.post('sales', [ApiSalesController, 'store'])
          router.get('sales/:id', [ApiSalesController, 'show'])
          router.patch('sales/:id/cancel', [ApiSalesController, 'cancel'])
          router.post('sales/:saleId/recoveries', [ApiSaleRecoveriesController, 'store'])
          router.get('debts', [ApiDebtsController, 'index'])
          router.get('recoveries', [ApiSaleRecoveriesController, 'index'])

          // Stock.
          router.get('stock', [ApiStockMovementsController, 'index'])
          router.post('stock/movements', [ApiStockMovementsController, 'store'])
          router.put('stock/movements/:id', [ApiStockMovementsController, 'update'])
          router.post('stock/validate-physical', [ApiStockMovementsController, 'validatePhysical'])
          router.put('stock/validate-physical/:id', [ApiStockMovementsController, 'updatePhysical'])
        })
        .use(middleware.apiAuth())
    })
    .prefix('api')
    .as('api')
}

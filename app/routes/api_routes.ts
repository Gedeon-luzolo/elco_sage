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
const ApiUsersController = () => import('#controllers/api/management/api_users_controller')
const ApiProductCategoriesController = () =>
  import('#controllers/api/management/api_product_categories_controller')
const ApiProductServicesAdminController = () =>
  import('#controllers/api/management/api_product_services_controller')
const ApiJournalisationsController = () =>
  import('#controllers/api/management/api_journalisations_controller')
const ApiDashboardController = () => import('#controllers/api/management/api_dashboard_controller')
const ApiExchangeRatesController = () =>
  import('#controllers/api/exchange_rates/api_exchange_rates_controller')

/**
 * Routes JSON consommées par la SPA (dossier web/).
 * Toutes vivent sous /api et, hors connexion, exigent un token Bearer.
 */
export function registerApiRoutes() {
  router
    .group(() => {
      // Connexion : seule route publique
      router.post('auth/login', [ApiSessionController, 'login'])

      router
        // Tout le reste exige un token valide
        .group(() => {
          router.get('auth/me', [ApiSessionController, 'me'])
          router.post('auth/verify-password', [ApiSessionController, 'verifyPassword'])
          router.post('auth/logout', [ApiSessionController, 'logout'])

          // Données de référence (mises en cache hors ligne par la SPA)
          router.get('operators', [ApiOperatorsController, 'index'])
          router.get('product-services/active-for-sale', [
            ApiProductServicesController,
            'activeForSale',
          ])
          router.get('exchange-rates', [ApiExchangeRatesController, 'index'])
          router.get('customers', [ApiCustomersController, 'index'])
          router.get('customers/active-for-sale', [ApiCustomersController, 'activeForSale'])
          router.post('customers', [ApiCustomersController, 'store'])
          router.patch('customers/:id', [ApiCustomersController, 'update'])

          // Sessions de caisse (les routes fixes sont déclarées avant :id)
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

          // Ventes, dettes et recouvrements
          router.get('sales', [ApiSalesController, 'index'])
          router.post('sales', [ApiSalesController, 'store'])
          router.patch('sales/:id/cancel', [ApiSalesController, 'cancel'])
          router.post('sales/:saleId/recoveries', [ApiSaleRecoveriesController, 'store'])
          router.get('debts', [ApiDebtsController, 'index'])
          router.get('recoveries', [ApiSaleRecoveriesController, 'index'])

          // Stock
          router.get('stock', [ApiStockMovementsController, 'index'])
          router.post('stock/movements', [ApiStockMovementsController, 'store'])
          router.patch('stock/movements/:id', [ApiStockMovementsController, 'update'])
          router.post('stock/validate-physical', [ApiStockMovementsController, 'validatePhysical'])
          router.patch('stock/validate-physical/:id', [
            ApiStockMovementsController,
            'updatePhysical',
          ])

          // Back-office : réservé à la direction
          router
            .group(() => {
              router.post('exchange-rates', [ApiExchangeRatesController, 'store'])
              router.get('dashboard', [ApiDashboardController, 'index'])
              router.get('journalisations', [ApiJournalisationsController, 'index'])
              router.get('users', [ApiUsersController, 'index'])
              router.post('users', [ApiUsersController, 'store'])
              router.patch('users/:id', [ApiUsersController, 'update'])
              router.delete('users/:id', [ApiUsersController, 'destroy'])
              router.get('product-categories', [ApiProductCategoriesController, 'index'])
              router.post('product-categories', [ApiProductCategoriesController, 'store'])
              router.patch('product-categories/:id', [ApiProductCategoriesController, 'update'])
              router.delete('product-categories/:id', [ApiProductCategoriesController, 'destroy'])
              router.get('product-services', [ApiProductServicesAdminController, 'index'])
              router.post('product-services', [ApiProductServicesAdminController, 'store'])
              router.patch('product-services/:id', [ApiProductServicesAdminController, 'update'])
              router.delete('product-services/:id', [ApiProductServicesAdminController, 'destroy'])
            })
            .use(middleware.apiManagement())
        })
        .use(middleware.apiAuth())
    })
    .prefix('api')
    .as('api')
}

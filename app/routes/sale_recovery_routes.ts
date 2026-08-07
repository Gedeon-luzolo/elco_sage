import router from '@adonisjs/core/services/router'

const SaleRecoveriesController = () =>
  import('#controllers/sales/financials/sale_recoveries_controller')

export function registerSaleRecoveryRoutes() {
  router
    .get('sales/recoveries', [SaleRecoveriesController, 'overview'])
    .as('sales.recoveries.overview')
  router
    .post('sales/:saleId/recoveries', [SaleRecoveriesController, 'store'])
    .as('sales.recoveries.store')
}

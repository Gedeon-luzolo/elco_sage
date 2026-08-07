import router from '@adonisjs/core/services/router'

const SaleRecoveriesController = () =>
  import('#controllers/sales/financials/sale_recoveries_controller')

export function registerSaleRecoveryRoutes() {
  router
    .get('sales/:saleId/recoveries', [SaleRecoveriesController, 'index'])
    .as('sales.recoveries.index')
  router
    .post('sales/:saleId/recoveries', [SaleRecoveriesController, 'store'])
    .as('sales.recoveries.store')
}

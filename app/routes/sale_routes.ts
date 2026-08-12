import router from '@adonisjs/core/services/router'

const SalesController = () => import('#controllers/sales/sales_controller')

export function registerSaleRoutes() {
  router.get('sales', [SalesController, 'index']).as('sales.index')
  router.get('sales/create', [SalesController, 'create']).as('sales.create')
  router.post('sales', [SalesController, 'store']).as('sales.store')
  router.get('sales/:id', [SalesController, 'show']).as('sales.show')
  router.patch('sales/:id/cancel', [SalesController, 'cancel']).as('sales.cancel')
}

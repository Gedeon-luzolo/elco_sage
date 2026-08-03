import router from '@adonisjs/core/services/router'

const StockMovementsController = () => import('#controllers/inventory/stock_movements_controller')

export function registerStockMovementRoutes() {
  router.get('/inventory', [StockMovementsController, 'index']).as('stock_movements.index')

  router
    .post('/inventory/movements', [StockMovementsController, 'store'])
    .as('stock_movements.store')

  router
    .post('/inventory/validate-physical', [StockMovementsController, 'validatePhysicalStock'])
    .as('stock_movements.validate_physical')
}

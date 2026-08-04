import router from '@adonisjs/core/services/router'

const StockMovementsController = () => import('#controllers/stock/stock_movements_controller')

export function registerStockMovementRoutes() {
  router.get('/stock', [StockMovementsController, 'index']).as('stock_movements.index')

  router.post('/stock/movements', [StockMovementsController, 'store']).as('stock_movements.store')

  router
    .post('/stock/validate-physical', [StockMovementsController, 'validatePhysicalStock'])
    .as('stock_movements.validate_physical')
}

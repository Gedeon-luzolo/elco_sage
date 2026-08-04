import router from '@adonisjs/core/services/router'

const StockMovementsController = () => import('#controllers/stock/stock_movements_controller')

export function registerStockMovementRoutes() {
  router.get('/stock', [StockMovementsController, 'index']).as('stock_movements.index')

  router.post('/stock/movements', [StockMovementsController, 'store']).as('stock_movements.store')

  router
    .put('/stock/movements/:id', [StockMovementsController, 'update'])
    .as('stock_movements.update')

  router
    .post('/stock/validate-physical', [StockMovementsController, 'validatePhysicalStock'])
    .as('stock_movements.validate_physical')

  router
    .put('/stock/validate-physical/:id', [StockMovementsController, 'updatePhysicalStock'])
    .as('stock_movements.update_physical')
}

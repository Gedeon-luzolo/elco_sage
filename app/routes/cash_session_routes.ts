import router from '@adonisjs/core/services/router'

const CashSessionsController = () => import('#controllers/sales/cash_sessions_controller')

export function registerCashSessionRoutes() {
  router.get('sales/session/open', [CashSessionsController, 'create']).as(
    'sales.cash_sessions.create'
  )
  router.post('sales/session/open', [CashSessionsController, 'store']).as(
    'sales.cash_sessions.store'
  )
  router.post('sales/session/close', [CashSessionsController, 'close']).as(
    'sales.cash_sessions.close'
  )
}

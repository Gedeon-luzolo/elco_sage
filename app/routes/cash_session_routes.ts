import router from '@adonisjs/core/services/router'

const CashSessionsController = () => import('#controllers/sales/cash_sessions_controller')

export function registerCashSessionRoutes() {
  router.get('sales/sessions', [CashSessionsController, 'index']).as('sales.cash_sessions.index')
  router.get('sales/sessions/:id', [CashSessionsController, 'show']).as('sales.cash_sessions.show')
  router
    .get('sales/session/open', [CashSessionsController, 'create'])
    .as('sales.cash_sessions.create')
  router
    .post('sales/session/open', [CashSessionsController, 'store'])
    .as('sales.cash_sessions.store')
  router
    .get('sales/session/system-amounts', [CashSessionsController, 'systemAmounts'])
    .as('sales.cash_sessions.system_amounts')
  router
    .post('sales/session/close', [CashSessionsController, 'close'])
    .as('sales.cash_sessions.close')
}

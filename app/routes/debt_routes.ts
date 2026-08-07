import router from '@adonisjs/core/services/router'

const DebtsController = () => import('#controllers/sales/financials/debts_controller')

export function registerDebtRoutes() {
  router.get('sales/debts', [DebtsController, 'index']).as('sales.debts.index')
  router.get('sales/recoveries', [DebtsController, 'recoveries']).as('sales.debts.recoveries')
}

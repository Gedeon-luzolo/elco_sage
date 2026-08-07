import { registerCashSessionRoutes } from '#routes/cash_session_routes'
import { registerDebtRoutes } from '#routes/debt_routes'
import { registerSaleRecoveryRoutes } from '#routes/sale_recovery_routes'
import { registerSaleRoutes } from '#routes/sale_routes'

export function registerSalesRoutes() {
  registerCashSessionRoutes()
  registerDebtRoutes()
  registerSaleRecoveryRoutes()
  registerSaleRoutes()
}

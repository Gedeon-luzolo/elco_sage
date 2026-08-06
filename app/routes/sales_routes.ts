import { registerCashSessionRoutes } from '#routes/cash_session_routes'
import { registerSaleRecoveryRoutes } from '#routes/sale_recovery_routes'
import { registerSaleRoutes } from '#routes/sale_routes'

export function registerSalesRoutes() {
  registerCashSessionRoutes()
  registerSaleRoutes()
  registerSaleRecoveryRoutes()
}

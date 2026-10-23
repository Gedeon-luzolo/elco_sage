import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'api.api_session.login': { paramsTuple?: []; params?: {} }
    'api.api_session.me': { paramsTuple?: []; params?: {} }
    'api.api_session.verify_password': { paramsTuple?: []; params?: {} }
    'api.api_session.logout': { paramsTuple?: []; params?: {} }
    'api.api_operators.index': { paramsTuple?: []; params?: {} }
    'api.api_product_services.active_for_sale': { paramsTuple?: []; params?: {} }
    'api.api_exchange_rates.index': { paramsTuple?: []; params?: {} }
    'api.api_customers.index': { paramsTuple?: []; params?: {} }
    'api.api_customers.active_for_sale': { paramsTuple?: []; params?: {} }
    'api.api_customers.store': { paramsTuple?: []; params?: {} }
    'api.api_customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_cash_sessions.index': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.current': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.system_amounts': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.addition_numbers': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.reserve_addition_numbers': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.close': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.store': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_sales.index': { paramsTuple?: []; params?: {} }
    'api.api_sales.store': { paramsTuple?: []; params?: {} }
    'api.api_sales.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_sale_recoveries.store': { paramsTuple: [ParamValue]; params: {'saleId': ParamValue} }
    'api.api_debts.index': { paramsTuple?: []; params?: {} }
    'api.api_sale_recoveries.index': { paramsTuple?: []; params?: {} }
    'api.api_stock_movements.index': { paramsTuple?: []; params?: {} }
    'api.api_stock_movements.store': { paramsTuple?: []; params?: {} }
    'api.api_stock_movements.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_stock_movements.validate_physical': { paramsTuple?: []; params?: {} }
    'api.api_stock_movements.update_physical': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_exchange_rates.store': { paramsTuple?: []; params?: {} }
    'api.api_dashboard.index': { paramsTuple?: []; params?: {} }
    'api.api_journalisations.index': { paramsTuple?: []; params?: {} }
    'api.api_users.index': { paramsTuple?: []; params?: {} }
    'api.api_users.store': { paramsTuple?: []; params?: {} }
    'api.api_users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_product_categories.index': { paramsTuple?: []; params?: {} }
    'api.api_product_categories.store': { paramsTuple?: []; params?: {} }
    'api.api_product_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_product_categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_product_services_admin.index': { paramsTuple?: []; params?: {} }
    'api.api_product_services_admin.store': { paramsTuple?: []; params?: {} }
    'api.api_product_services_admin.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_product_services_admin.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'api.api_session.login': { paramsTuple?: []; params?: {} }
    'api.api_session.verify_password': { paramsTuple?: []; params?: {} }
    'api.api_session.logout': { paramsTuple?: []; params?: {} }
    'api.api_customers.store': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.reserve_addition_numbers': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.close': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.store': { paramsTuple?: []; params?: {} }
    'api.api_sales.store': { paramsTuple?: []; params?: {} }
    'api.api_sale_recoveries.store': { paramsTuple: [ParamValue]; params: {'saleId': ParamValue} }
    'api.api_stock_movements.store': { paramsTuple?: []; params?: {} }
    'api.api_stock_movements.validate_physical': { paramsTuple?: []; params?: {} }
    'api.api_exchange_rates.store': { paramsTuple?: []; params?: {} }
    'api.api_users.store': { paramsTuple?: []; params?: {} }
    'api.api_product_categories.store': { paramsTuple?: []; params?: {} }
    'api.api_product_services_admin.store': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'api.api_session.me': { paramsTuple?: []; params?: {} }
    'api.api_operators.index': { paramsTuple?: []; params?: {} }
    'api.api_product_services.active_for_sale': { paramsTuple?: []; params?: {} }
    'api.api_exchange_rates.index': { paramsTuple?: []; params?: {} }
    'api.api_customers.index': { paramsTuple?: []; params?: {} }
    'api.api_customers.active_for_sale': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.index': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.current': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.system_amounts': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.addition_numbers': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_sales.index': { paramsTuple?: []; params?: {} }
    'api.api_debts.index': { paramsTuple?: []; params?: {} }
    'api.api_sale_recoveries.index': { paramsTuple?: []; params?: {} }
    'api.api_stock_movements.index': { paramsTuple?: []; params?: {} }
    'api.api_dashboard.index': { paramsTuple?: []; params?: {} }
    'api.api_journalisations.index': { paramsTuple?: []; params?: {} }
    'api.api_users.index': { paramsTuple?: []; params?: {} }
    'api.api_product_categories.index': { paramsTuple?: []; params?: {} }
    'api.api_product_services_admin.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'api.api_session.me': { paramsTuple?: []; params?: {} }
    'api.api_operators.index': { paramsTuple?: []; params?: {} }
    'api.api_product_services.active_for_sale': { paramsTuple?: []; params?: {} }
    'api.api_exchange_rates.index': { paramsTuple?: []; params?: {} }
    'api.api_customers.index': { paramsTuple?: []; params?: {} }
    'api.api_customers.active_for_sale': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.index': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.current': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.system_amounts': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.addition_numbers': { paramsTuple?: []; params?: {} }
    'api.api_cash_sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_sales.index': { paramsTuple?: []; params?: {} }
    'api.api_debts.index': { paramsTuple?: []; params?: {} }
    'api.api_sale_recoveries.index': { paramsTuple?: []; params?: {} }
    'api.api_stock_movements.index': { paramsTuple?: []; params?: {} }
    'api.api_dashboard.index': { paramsTuple?: []; params?: {} }
    'api.api_journalisations.index': { paramsTuple?: []; params?: {} }
    'api.api_users.index': { paramsTuple?: []; params?: {} }
    'api.api_product_categories.index': { paramsTuple?: []; params?: {} }
    'api.api_product_services_admin.index': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'api.api_customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_sales.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_stock_movements.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_stock_movements.update_physical': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_product_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_product_services_admin.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'api.api_users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_product_categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.api_product_services_admin.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'splash': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'auth.verify_password': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'customers.index': { paramsTuple?: []; params?: {} }
    'customers.store': { paramsTuple?: []; params?: {} }
    'customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'stock_movements.index': { paramsTuple?: []; params?: {} }
    'stock_movements.store': { paramsTuple?: []; params?: {} }
    'stock_movements.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'stock_movements.validate_physical': { paramsTuple?: []; params?: {} }
    'stock_movements.update_physical': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sales.cash_sessions.create': { paramsTuple?: []; params?: {} }
    'sales.cash_sessions.store': { paramsTuple?: []; params?: {} }
    'sales.cash_sessions.system_amounts': { paramsTuple?: []; params?: {} }
    'sales.cash_sessions.close': { paramsTuple?: []; params?: {} }
    'sales.debts.index': { paramsTuple?: []; params?: {} }
    'sales.index': { paramsTuple?: []; params?: {} }
    'sales.create': { paramsTuple?: []; params?: {} }
    'sales.store': { paramsTuple?: []; params?: {} }
    'sales.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sales.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sales.recoveries.index': { paramsTuple: [ParamValue]; params: {'saleId': ParamValue} }
    'sales.recoveries.store': { paramsTuple: [ParamValue]; params: {'saleId': ParamValue} }
    'management': { paramsTuple?: []; params?: {} }
    'journalisations.get_journalisations': { paramsTuple?: []; params?: {} }
    'users.get': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exchange_rates.get': { paramsTuple?: []; params?: {} }
    'exchange_rates.store': { paramsTuple?: []; params?: {} }
    'product_categories.index': { paramsTuple?: []; params?: {} }
    'product_categories.store': { paramsTuple?: []; params?: {} }
    'product_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product_categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product_services.index': { paramsTuple?: []; params?: {} }
    'product_services.active_for_sale': { paramsTuple?: []; params?: {} }
    'product_services.store': { paramsTuple?: []; params?: {} }
    'product_services.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product_services.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'splash': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'customers.index': { paramsTuple?: []; params?: {} }
    'stock_movements.index': { paramsTuple?: []; params?: {} }
    'sales.cash_sessions.create': { paramsTuple?: []; params?: {} }
    'sales.cash_sessions.system_amounts': { paramsTuple?: []; params?: {} }
    'sales.debts.index': { paramsTuple?: []; params?: {} }
    'sales.index': { paramsTuple?: []; params?: {} }
    'sales.create': { paramsTuple?: []; params?: {} }
    'sales.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sales.recoveries.index': { paramsTuple: [ParamValue]; params: {'saleId': ParamValue} }
    'management': { paramsTuple?: []; params?: {} }
    'journalisations.get_journalisations': { paramsTuple?: []; params?: {} }
    'users.get': { paramsTuple?: []; params?: {} }
    'exchange_rates.get': { paramsTuple?: []; params?: {} }
    'product_categories.index': { paramsTuple?: []; params?: {} }
    'product_services.index': { paramsTuple?: []; params?: {} }
    'product_services.active_for_sale': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'splash': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'customers.index': { paramsTuple?: []; params?: {} }
    'stock_movements.index': { paramsTuple?: []; params?: {} }
    'sales.cash_sessions.create': { paramsTuple?: []; params?: {} }
    'sales.cash_sessions.system_amounts': { paramsTuple?: []; params?: {} }
    'sales.debts.index': { paramsTuple?: []; params?: {} }
    'sales.index': { paramsTuple?: []; params?: {} }
    'sales.create': { paramsTuple?: []; params?: {} }
    'sales.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sales.recoveries.index': { paramsTuple: [ParamValue]; params: {'saleId': ParamValue} }
    'management': { paramsTuple?: []; params?: {} }
    'journalisations.get_journalisations': { paramsTuple?: []; params?: {} }
    'users.get': { paramsTuple?: []; params?: {} }
    'exchange_rates.get': { paramsTuple?: []; params?: {} }
    'product_categories.index': { paramsTuple?: []; params?: {} }
    'product_services.index': { paramsTuple?: []; params?: {} }
    'product_services.active_for_sale': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'auth.verify_password': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'customers.store': { paramsTuple?: []; params?: {} }
    'stock_movements.store': { paramsTuple?: []; params?: {} }
    'stock_movements.validate_physical': { paramsTuple?: []; params?: {} }
    'sales.cash_sessions.store': { paramsTuple?: []; params?: {} }
    'sales.cash_sessions.close': { paramsTuple?: []; params?: {} }
    'sales.store': { paramsTuple?: []; params?: {} }
    'sales.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sales.recoveries.store': { paramsTuple: [ParamValue]; params: {'saleId': ParamValue} }
    'users.store': { paramsTuple?: []; params?: {} }
    'exchange_rates.store': { paramsTuple?: []; params?: {} }
    'product_categories.store': { paramsTuple?: []; params?: {} }
    'product_services.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'stock_movements.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'stock_movements.update_physical': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product_services.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product_categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product_services.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
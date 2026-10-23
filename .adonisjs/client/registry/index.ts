/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'api.api_session.login': {
    methods: ["POST"],
    pattern: '/api/auth/login',
    tokens: [[0,"api"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['api.api_session.login']['types'],
  },
  'api.api_session.me': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/me',
    tokens: [[0,"api"],[0,"auth"],[0,"me"]],
    types: placeholder as Registry['api.api_session.me']['types'],
  },
  'api.api_session.verify_password': {
    methods: ["POST"],
    pattern: '/api/auth/verify-password',
    tokens: [[0,"api"],[0,"auth"],[0,"verify-password"]],
    types: placeholder as Registry['api.api_session.verify_password']['types'],
  },
  'api.api_session.logout': {
    methods: ["POST"],
    pattern: '/api/auth/logout',
    tokens: [[0,"api"],[0,"auth"],[0,"logout"]],
    types: placeholder as Registry['api.api_session.logout']['types'],
  },
  'api.api_operators.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/operators',
    tokens: [[0,"api"],[0,"operators"]],
    types: placeholder as Registry['api.api_operators.index']['types'],
  },
  'api.api_product_services.active_for_sale': {
    methods: ["GET","HEAD"],
    pattern: '/api/product-services/active-for-sale',
    tokens: [[0,"api"],[0,"product-services"],[0,"active-for-sale"]],
    types: placeholder as Registry['api.api_product_services.active_for_sale']['types'],
  },
  'api.api_exchange_rates.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/exchange-rates',
    tokens: [[0,"api"],[0,"exchange-rates"]],
    types: placeholder as Registry['api.api_exchange_rates.index']['types'],
  },
  'api.api_customers.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/customers',
    tokens: [[0,"api"],[0,"customers"]],
    types: placeholder as Registry['api.api_customers.index']['types'],
  },
  'api.api_customers.active_for_sale': {
    methods: ["GET","HEAD"],
    pattern: '/api/customers/active-for-sale',
    tokens: [[0,"api"],[0,"customers"],[0,"active-for-sale"]],
    types: placeholder as Registry['api.api_customers.active_for_sale']['types'],
  },
  'api.api_customers.store': {
    methods: ["POST"],
    pattern: '/api/customers',
    tokens: [[0,"api"],[0,"customers"]],
    types: placeholder as Registry['api.api_customers.store']['types'],
  },
  'api.api_customers.update': {
    methods: ["PUT"],
    pattern: '/api/customers/:id',
    tokens: [[0,"api"],[0,"customers"],[1,"id"]],
    types: placeholder as Registry['api.api_customers.update']['types'],
  },
  'api.api_cash_sessions.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/cash-sessions',
    tokens: [[0,"api"],[0,"cash-sessions"]],
    types: placeholder as Registry['api.api_cash_sessions.index']['types'],
  },
  'api.api_cash_sessions.current': {
    methods: ["GET","HEAD"],
    pattern: '/api/cash-sessions/current',
    tokens: [[0,"api"],[0,"cash-sessions"],[0,"current"]],
    types: placeholder as Registry['api.api_cash_sessions.current']['types'],
  },
  'api.api_cash_sessions.system_amounts': {
    methods: ["GET","HEAD"],
    pattern: '/api/cash-sessions/current/system-amounts',
    tokens: [[0,"api"],[0,"cash-sessions"],[0,"current"],[0,"system-amounts"]],
    types: placeholder as Registry['api.api_cash_sessions.system_amounts']['types'],
  },
  'api.api_cash_sessions.addition_numbers': {
    methods: ["GET","HEAD"],
    pattern: '/api/cash-sessions/current/addition-numbers',
    tokens: [[0,"api"],[0,"cash-sessions"],[0,"current"],[0,"addition-numbers"]],
    types: placeholder as Registry['api.api_cash_sessions.addition_numbers']['types'],
  },
  'api.api_cash_sessions.reserve_addition_numbers': {
    methods: ["POST"],
    pattern: '/api/cash-sessions/current/addition-numbers',
    tokens: [[0,"api"],[0,"cash-sessions"],[0,"current"],[0,"addition-numbers"]],
    types: placeholder as Registry['api.api_cash_sessions.reserve_addition_numbers']['types'],
  },
  'api.api_cash_sessions.close': {
    methods: ["POST"],
    pattern: '/api/cash-sessions/close',
    tokens: [[0,"api"],[0,"cash-sessions"],[0,"close"]],
    types: placeholder as Registry['api.api_cash_sessions.close']['types'],
  },
  'api.api_cash_sessions.store': {
    methods: ["POST"],
    pattern: '/api/cash-sessions',
    tokens: [[0,"api"],[0,"cash-sessions"]],
    types: placeholder as Registry['api.api_cash_sessions.store']['types'],
  },
  'api.api_cash_sessions.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/cash-sessions/:id',
    tokens: [[0,"api"],[0,"cash-sessions"],[1,"id"]],
    types: placeholder as Registry['api.api_cash_sessions.show']['types'],
  },
  'api.api_sales.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/sales',
    tokens: [[0,"api"],[0,"sales"]],
    types: placeholder as Registry['api.api_sales.index']['types'],
  },
  'api.api_sales.store': {
    methods: ["POST"],
    pattern: '/api/sales',
    tokens: [[0,"api"],[0,"sales"]],
    types: placeholder as Registry['api.api_sales.store']['types'],
  },
  'api.api_sales.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/sales/:id',
    tokens: [[0,"api"],[0,"sales"],[1,"id"]],
    types: placeholder as Registry['api.api_sales.show']['types'],
  },
  'api.api_sales.cancel': {
    methods: ["PATCH"],
    pattern: '/api/sales/:id/cancel',
    tokens: [[0,"api"],[0,"sales"],[1,"id"],[0,"cancel"]],
    types: placeholder as Registry['api.api_sales.cancel']['types'],
  },
  'api.api_sale_recoveries.store': {
    methods: ["POST"],
    pattern: '/api/sales/:saleId/recoveries',
    tokens: [[0,"api"],[0,"sales"],[1,"saleId"],[0,"recoveries"]],
    types: placeholder as Registry['api.api_sale_recoveries.store']['types'],
  },
  'api.api_debts.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/debts',
    tokens: [[0,"api"],[0,"debts"]],
    types: placeholder as Registry['api.api_debts.index']['types'],
  },
  'api.api_sale_recoveries.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/recoveries',
    tokens: [[0,"api"],[0,"recoveries"]],
    types: placeholder as Registry['api.api_sale_recoveries.index']['types'],
  },
  'api.api_stock_movements.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/stock',
    tokens: [[0,"api"],[0,"stock"]],
    types: placeholder as Registry['api.api_stock_movements.index']['types'],
  },
  'api.api_stock_movements.store': {
    methods: ["POST"],
    pattern: '/api/stock/movements',
    tokens: [[0,"api"],[0,"stock"],[0,"movements"]],
    types: placeholder as Registry['api.api_stock_movements.store']['types'],
  },
  'api.api_stock_movements.update': {
    methods: ["PUT"],
    pattern: '/api/stock/movements/:id',
    tokens: [[0,"api"],[0,"stock"],[0,"movements"],[1,"id"]],
    types: placeholder as Registry['api.api_stock_movements.update']['types'],
  },
  'api.api_stock_movements.validate_physical': {
    methods: ["POST"],
    pattern: '/api/stock/validate-physical',
    tokens: [[0,"api"],[0,"stock"],[0,"validate-physical"]],
    types: placeholder as Registry['api.api_stock_movements.validate_physical']['types'],
  },
  'api.api_stock_movements.update_physical': {
    methods: ["PUT"],
    pattern: '/api/stock/validate-physical/:id',
    tokens: [[0,"api"],[0,"stock"],[0,"validate-physical"],[1,"id"]],
    types: placeholder as Registry['api.api_stock_movements.update_physical']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['home']['types'],
  },
  'splash': {
    methods: ["GET","HEAD"],
    pattern: '/splash',
    tokens: [[0,"splash"]],
    types: placeholder as Registry['splash']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.store']['types'],
  },
  'auth.verify_password': {
    methods: ["POST"],
    pattern: '/auth/verify-password',
    tokens: [[0,"auth"],[0,"verify-password"]],
    types: placeholder as Registry['auth.verify_password']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [[0,"logout"]],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'customers.index': {
    methods: ["GET","HEAD"],
    pattern: '/customers',
    tokens: [[0,"customers"]],
    types: placeholder as Registry['customers.index']['types'],
  },
  'customers.store': {
    methods: ["POST"],
    pattern: '/customers',
    tokens: [[0,"customers"]],
    types: placeholder as Registry['customers.store']['types'],
  },
  'customers.update': {
    methods: ["PUT"],
    pattern: '/customers/:id',
    tokens: [[0,"customers"],[1,"id"]],
    types: placeholder as Registry['customers.update']['types'],
  },
  'stock_movements.index': {
    methods: ["GET","HEAD"],
    pattern: '/stock',
    tokens: [[0,"stock"]],
    types: placeholder as Registry['stock_movements.index']['types'],
  },
  'stock_movements.store': {
    methods: ["POST"],
    pattern: '/stock/movements',
    tokens: [[0,"stock"],[0,"movements"]],
    types: placeholder as Registry['stock_movements.store']['types'],
  },
  'stock_movements.update': {
    methods: ["PUT"],
    pattern: '/stock/movements/:id',
    tokens: [[0,"stock"],[0,"movements"],[1,"id"]],
    types: placeholder as Registry['stock_movements.update']['types'],
  },
  'stock_movements.validate_physical': {
    methods: ["POST"],
    pattern: '/stock/validate-physical',
    tokens: [[0,"stock"],[0,"validate-physical"]],
    types: placeholder as Registry['stock_movements.validate_physical']['types'],
  },
  'stock_movements.update_physical': {
    methods: ["PUT"],
    pattern: '/stock/validate-physical/:id',
    tokens: [[0,"stock"],[0,"validate-physical"],[1,"id"]],
    types: placeholder as Registry['stock_movements.update_physical']['types'],
  },
  'sales.cash_sessions.index': {
    methods: ["GET","HEAD"],
    pattern: '/sales/sessions',
    tokens: [[0,"sales"],[0,"sessions"]],
    types: placeholder as Registry['sales.cash_sessions.index']['types'],
  },
  'sales.cash_sessions.show': {
    methods: ["GET","HEAD"],
    pattern: '/sales/sessions/:id',
    tokens: [[0,"sales"],[0,"sessions"],[1,"id"]],
    types: placeholder as Registry['sales.cash_sessions.show']['types'],
  },
  'sales.cash_sessions.create': {
    methods: ["GET","HEAD"],
    pattern: '/sales/session/open',
    tokens: [[0,"sales"],[0,"session"],[0,"open"]],
    types: placeholder as Registry['sales.cash_sessions.create']['types'],
  },
  'sales.cash_sessions.store': {
    methods: ["POST"],
    pattern: '/sales/session/open',
    tokens: [[0,"sales"],[0,"session"],[0,"open"]],
    types: placeholder as Registry['sales.cash_sessions.store']['types'],
  },
  'sales.cash_sessions.system_amounts': {
    methods: ["GET","HEAD"],
    pattern: '/sales/session/system-amounts',
    tokens: [[0,"sales"],[0,"session"],[0,"system-amounts"]],
    types: placeholder as Registry['sales.cash_sessions.system_amounts']['types'],
  },
  'sales.cash_sessions.close': {
    methods: ["POST"],
    pattern: '/sales/session/close',
    tokens: [[0,"sales"],[0,"session"],[0,"close"]],
    types: placeholder as Registry['sales.cash_sessions.close']['types'],
  },
  'sales.debts.index': {
    methods: ["GET","HEAD"],
    pattern: '/sales/debts',
    tokens: [[0,"sales"],[0,"debts"]],
    types: placeholder as Registry['sales.debts.index']['types'],
  },
  'sales.recoveries.overview': {
    methods: ["GET","HEAD"],
    pattern: '/sales/recoveries',
    tokens: [[0,"sales"],[0,"recoveries"]],
    types: placeholder as Registry['sales.recoveries.overview']['types'],
  },
  'sales.recoveries.store': {
    methods: ["POST"],
    pattern: '/sales/:saleId/recoveries',
    tokens: [[0,"sales"],[1,"saleId"],[0,"recoveries"]],
    types: placeholder as Registry['sales.recoveries.store']['types'],
  },
  'sales.index': {
    methods: ["GET","HEAD"],
    pattern: '/sales',
    tokens: [[0,"sales"]],
    types: placeholder as Registry['sales.index']['types'],
  },
  'sales.create': {
    methods: ["GET","HEAD"],
    pattern: '/sales/create',
    tokens: [[0,"sales"],[0,"create"]],
    types: placeholder as Registry['sales.create']['types'],
  },
  'sales.history': {
    methods: ["GET","HEAD"],
    pattern: '/sales/history',
    tokens: [[0,"sales"],[0,"history"]],
    types: placeholder as Registry['sales.history']['types'],
  },
  'sales.store': {
    methods: ["POST"],
    pattern: '/sales',
    tokens: [[0,"sales"]],
    types: placeholder as Registry['sales.store']['types'],
  },
  'sales.show': {
    methods: ["GET","HEAD"],
    pattern: '/sales/:id',
    tokens: [[0,"sales"],[1,"id"]],
    types: placeholder as Registry['sales.show']['types'],
  },
  'sales.cancel': {
    methods: ["PATCH"],
    pattern: '/sales/:id/cancel',
    tokens: [[0,"sales"],[1,"id"],[0,"cancel"]],
    types: placeholder as Registry['sales.cancel']['types'],
  },
  'management': {
    methods: ["GET","HEAD"],
    pattern: '/management',
    tokens: [[0,"management"]],
    types: placeholder as Registry['management']['types'],
  },
  'journalisations.get_journalisations': {
    methods: ["GET","HEAD"],
    pattern: '/management/journalisations',
    tokens: [[0,"management"],[0,"journalisations"]],
    types: placeholder as Registry['journalisations.get_journalisations']['types'],
  },
  'users.get': {
    methods: ["GET","HEAD"],
    pattern: '/management/users',
    tokens: [[0,"management"],[0,"users"]],
    types: placeholder as Registry['users.get']['types'],
  },
  'users.store': {
    methods: ["POST"],
    pattern: '/management/users',
    tokens: [[0,"management"],[0,"users"]],
    types: placeholder as Registry['users.store']['types'],
  },
  'users.update': {
    methods: ["PUT"],
    pattern: '/management/users/:id',
    tokens: [[0,"management"],[0,"users"],[1,"id"]],
    types: placeholder as Registry['users.update']['types'],
  },
  'users.destroy': {
    methods: ["DELETE"],
    pattern: '/management/users/:id',
    tokens: [[0,"management"],[0,"users"],[1,"id"]],
    types: placeholder as Registry['users.destroy']['types'],
  },
  'exchange_rates.get': {
    methods: ["GET","HEAD"],
    pattern: '/management/rates',
    tokens: [[0,"management"],[0,"rates"]],
    types: placeholder as Registry['exchange_rates.get']['types'],
  },
  'exchange_rates.store': {
    methods: ["POST"],
    pattern: '/management/rates',
    tokens: [[0,"management"],[0,"rates"]],
    types: placeholder as Registry['exchange_rates.store']['types'],
  },
  'product_categories.index': {
    methods: ["GET","HEAD"],
    pattern: '/management/product-categories',
    tokens: [[0,"management"],[0,"product-categories"]],
    types: placeholder as Registry['product_categories.index']['types'],
  },
  'product_categories.store': {
    methods: ["POST"],
    pattern: '/management/product-categories',
    tokens: [[0,"management"],[0,"product-categories"]],
    types: placeholder as Registry['product_categories.store']['types'],
  },
  'product_categories.update': {
    methods: ["PUT"],
    pattern: '/management/product-categories/:id',
    tokens: [[0,"management"],[0,"product-categories"],[1,"id"]],
    types: placeholder as Registry['product_categories.update']['types'],
  },
  'product_categories.destroy': {
    methods: ["DELETE"],
    pattern: '/management/product-categories/:id',
    tokens: [[0,"management"],[0,"product-categories"],[1,"id"]],
    types: placeholder as Registry['product_categories.destroy']['types'],
  },
  'product_services.index': {
    methods: ["GET","HEAD"],
    pattern: '/management/product-services',
    tokens: [[0,"management"],[0,"product-services"]],
    types: placeholder as Registry['product_services.index']['types'],
  },
  'product_services.active_for_sale': {
    methods: ["GET","HEAD"],
    pattern: '/management/product-services/active-services-for-sale',
    tokens: [[0,"management"],[0,"product-services"],[0,"active-services-for-sale"]],
    types: placeholder as Registry['product_services.active_for_sale']['types'],
  },
  'product_services.store': {
    methods: ["POST"],
    pattern: '/management/product-services',
    tokens: [[0,"management"],[0,"product-services"]],
    types: placeholder as Registry['product_services.store']['types'],
  },
  'product_services.update': {
    methods: ["PUT"],
    pattern: '/management/product-services/:id',
    tokens: [[0,"management"],[0,"product-services"],[1,"id"]],
    types: placeholder as Registry['product_services.update']['types'],
  },
  'product_services.destroy': {
    methods: ["DELETE"],
    pattern: '/management/product-services/:id',
    tokens: [[0,"management"],[0,"product-services"],[1,"id"]],
    types: placeholder as Registry['product_services.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}

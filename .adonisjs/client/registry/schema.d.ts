/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'splash': {
    methods: ["GET","HEAD"]
    pattern: '/splash'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['store']>>>
    }
  }
  'auth.verify_password': {
    methods: ["POST"]
    pattern: '/auth/verify-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/password').verifyPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/password').verifyPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['verifyPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['verifyPassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['destroy']>>>
    }
  }
  'customers.index': {
    methods: ["GET","HEAD"]
    pattern: '/customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_controller').default['index']>>>
    }
  }
  'customers.store': {
    methods: ["POST"]
    pattern: '/customers'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customer').createCustomerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customer').createCustomerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.update': {
    methods: ["PUT"]
    pattern: '/customers/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customer').updateCustomerValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/customer').updateCustomerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'stock_movements.index': {
    methods: ["GET","HEAD"]
    pattern: '/stock'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stock/stock_movements_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stock/stock_movements_controller').default['index']>>>
    }
  }
  'stock_movements.store': {
    methods: ["POST"]
    pattern: '/stock/movements'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/stock_movement').createStockMovementValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/stock_movement').createStockMovementValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stock/stock_movements_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stock/stock_movements_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'stock_movements.update': {
    methods: ["PUT"]
    pattern: '/stock/movements/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/stock_movement').createStockMovementValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/stock_movement').createStockMovementValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stock/stock_movements_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stock/stock_movements_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'stock_movements.validate_physical': {
    methods: ["POST"]
    pattern: '/stock/validate-physical'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/stock_movement').validatePhysicalStockValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/stock_movement').validatePhysicalStockValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stock/stock_movements_controller').default['validatePhysicalStock']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stock/stock_movements_controller').default['validatePhysicalStock']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'stock_movements.update_physical': {
    methods: ["PUT"]
    pattern: '/stock/validate-physical/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/stock_movement').validatePhysicalStockValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/stock_movement').validatePhysicalStockValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stock/stock_movements_controller').default['updatePhysicalStock']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stock/stock_movements_controller').default['updatePhysicalStock']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sales.cash_sessions.index': {
    methods: ["GET","HEAD"]
    pattern: '/sales/sessions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/cash_sessions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/cash_sessions_controller').default['index']>>>
    }
  }
  'sales.cash_sessions.create': {
    methods: ["GET","HEAD"]
    pattern: '/sales/session/open'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/cash_sessions_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/cash_sessions_controller').default['create']>>>
    }
  }
  'sales.cash_sessions.store': {
    methods: ["POST"]
    pattern: '/sales/session/open'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/cash_sessions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/cash_sessions_controller').default['store']>>>
    }
  }
  'sales.cash_sessions.system_amounts': {
    methods: ["GET","HEAD"]
    pattern: '/sales/session/system-amounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/cash_sessions_controller').default['systemAmounts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/cash_sessions_controller').default['systemAmounts']>>>
    }
  }
  'sales.cash_sessions.close': {
    methods: ["POST"]
    pattern: '/sales/session/close'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cash_session').closeCashSessionValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/cash_session').closeCashSessionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/cash_sessions_controller').default['close']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/cash_sessions_controller').default['close']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sales.debts.index': {
    methods: ["GET","HEAD"]
    pattern: '/sales/debts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/financials/debts_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/financials/debts_controller').default['index']>>>
    }
  }
  'sales.debts.recoveries': {
    methods: ["GET","HEAD"]
    pattern: '/sales/recoveries'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/financials/debts_controller').default['recoveries']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/financials/debts_controller').default['recoveries']>>>
    }
  }
  'sales.index': {
    methods: ["GET","HEAD"]
    pattern: '/sales'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/sales_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/sales_controller').default['index']>>>
    }
  }
  'sales.create': {
    methods: ["GET","HEAD"]
    pattern: '/sales/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/sales_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/sales_controller').default['create']>>>
    }
  }
  'sales.store': {
    methods: ["POST"]
    pattern: '/sales'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/sale').createSaleValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/sale').createSaleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/sales_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/sales_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sales.show': {
    methods: ["GET","HEAD"]
    pattern: '/sales/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/sales_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/sales_controller').default['show']>>>
    }
  }
  'sales.cancel': {
    methods: ["POST"]
    pattern: '/sales/:id/cancel'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/sales_controller').default['cancel']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/sales_controller').default['cancel']>>>
    }
  }
  'sales.recoveries.index': {
    methods: ["GET","HEAD"]
    pattern: '/sales/:saleId/recoveries'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { saleId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/financials/sale_recoveries_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/financials/sale_recoveries_controller').default['index']>>>
    }
  }
  'sales.recoveries.store': {
    methods: ["POST"]
    pattern: '/sales/:saleId/recoveries'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/sale_recovery').createSaleRecoveryValidator)>>
      paramsTuple: [ParamValue]
      params: { saleId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/sale_recovery').createSaleRecoveryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sales/financials/sale_recoveries_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sales/financials/sale_recoveries_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'management': {
    methods: ["GET","HEAD"]
    pattern: '/management'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'journalisations.get_journalisations': {
    methods: ["GET","HEAD"]
    pattern: '/management/journalisations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/journalisations/journalisations_controller').default['getJournalisations']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/journalisations/journalisations_controller').default['getJournalisations']>>>
    }
  }
  'users.get': {
    methods: ["GET","HEAD"]
    pattern: '/management/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users/users_controller').default['getUsers']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users/users_controller').default['getUsers']>>>
    }
  }
  'users.store': {
    methods: ["POST"]
    pattern: '/management/users'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').createUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').createUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users/users_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users/users_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.update': {
    methods: ["PUT"]
    pattern: '/management/users/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateUserValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users/users_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users/users_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.destroy': {
    methods: ["DELETE"]
    pattern: '/management/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users/users_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users/users_controller').default['destroy']>>>
    }
  }
  'exchange_rates.get': {
    methods: ["GET","HEAD"]
    pattern: '/management/rates'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exchange_rates/exchange_rates_controller').default['getExchangeRates']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exchange_rates/exchange_rates_controller').default['getExchangeRates']>>>
    }
  }
  'exchange_rates.store': {
    methods: ["POST"]
    pattern: '/management/rates'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/exchange_rate').createExchangeRateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/exchange_rate').createExchangeRateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exchange_rates/exchange_rates_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exchange_rates/exchange_rates_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'product_categories.index': {
    methods: ["GET","HEAD"]
    pattern: '/management/product-categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories/product_categories_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories/product_categories_controller').default['index']>>>
    }
  }
  'product_categories.store': {
    methods: ["POST"]
    pattern: '/management/product-categories'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product_category').createProductCategoryValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/product_category').createProductCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories/product_categories_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories/product_categories_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'product_categories.update': {
    methods: ["PUT"]
    pattern: '/management/product-categories/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product_category').updateProductCategoryValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/product_category').updateProductCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories/product_categories_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories/product_categories_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'product_categories.destroy': {
    methods: ["DELETE"]
    pattern: '/management/product-categories/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories/product_categories_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories/product_categories_controller').default['destroy']>>>
    }
  }
  'product_services.index': {
    methods: ["GET","HEAD"]
    pattern: '/management/product-services'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products/product_services_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products/product_services_controller').default['index']>>>
    }
  }
  'product_services.active_for_sale': {
    methods: ["GET","HEAD"]
    pattern: '/management/product-services/active-services-for-sale'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products/product_services_controller').default['activeForSale']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products/product_services_controller').default['activeForSale']>>>
    }
  }
  'product_services.store': {
    methods: ["POST"]
    pattern: '/management/product-services'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product_service').createProductServiceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/product_service').createProductServiceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products/product_services_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products/product_services_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'product_services.update': {
    methods: ["PUT"]
    pattern: '/management/product-services/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product_service').updateProductServiceValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/product_service').updateProductServiceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products/product_services_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products/product_services_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'product_services.destroy': {
    methods: ["DELETE"]
    pattern: '/management/product-services/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products/product_services_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products/product_services_controller').default['destroy']>>>
    }
  }
}

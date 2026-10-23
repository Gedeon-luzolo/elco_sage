/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  api: {
    apiSession: {
      login: typeof routes['api.api_session.login']
      me: typeof routes['api.api_session.me']
      verifyPassword: typeof routes['api.api_session.verify_password']
      logout: typeof routes['api.api_session.logout']
    }
    apiOperators: {
      index: typeof routes['api.api_operators.index']
    }
    apiProductServices: {
      activeForSale: typeof routes['api.api_product_services.active_for_sale']
    }
    apiExchangeRates: {
      index: typeof routes['api.api_exchange_rates.index']
    }
    apiCustomers: {
      index: typeof routes['api.api_customers.index']
      activeForSale: typeof routes['api.api_customers.active_for_sale']
      store: typeof routes['api.api_customers.store']
      update: typeof routes['api.api_customers.update']
    }
    apiCashSessions: {
      index: typeof routes['api.api_cash_sessions.index']
      current: typeof routes['api.api_cash_sessions.current']
      systemAmounts: typeof routes['api.api_cash_sessions.system_amounts']
      additionNumbers: typeof routes['api.api_cash_sessions.addition_numbers']
      reserveAdditionNumbers: typeof routes['api.api_cash_sessions.reserve_addition_numbers']
      close: typeof routes['api.api_cash_sessions.close']
      store: typeof routes['api.api_cash_sessions.store']
      show: typeof routes['api.api_cash_sessions.show']
    }
    apiSales: {
      index: typeof routes['api.api_sales.index']
      store: typeof routes['api.api_sales.store']
      show: typeof routes['api.api_sales.show']
      cancel: typeof routes['api.api_sales.cancel']
    }
    apiSaleRecoveries: {
      store: typeof routes['api.api_sale_recoveries.store']
      index: typeof routes['api.api_sale_recoveries.index']
    }
    apiDebts: {
      index: typeof routes['api.api_debts.index']
    }
    apiStockMovements: {
      index: typeof routes['api.api_stock_movements.index']
      store: typeof routes['api.api_stock_movements.store']
      update: typeof routes['api.api_stock_movements.update']
      validatePhysical: typeof routes['api.api_stock_movements.validate_physical']
      updatePhysical: typeof routes['api.api_stock_movements.update_physical']
    }
  }
  home: typeof routes['home']
  splash: typeof routes['splash']
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  auth: {
    verifyPassword: typeof routes['auth.verify_password']
  }
  customers: {
    index: typeof routes['customers.index']
    store: typeof routes['customers.store']
    update: typeof routes['customers.update']
  }
  stockMovements: {
    index: typeof routes['stock_movements.index']
    store: typeof routes['stock_movements.store']
    update: typeof routes['stock_movements.update']
    validatePhysical: typeof routes['stock_movements.validate_physical']
    updatePhysical: typeof routes['stock_movements.update_physical']
  }
  sales: {
    cashSessions: {
      index: typeof routes['sales.cash_sessions.index']
      show: typeof routes['sales.cash_sessions.show']
      create: typeof routes['sales.cash_sessions.create']
      store: typeof routes['sales.cash_sessions.store']
      systemAmounts: typeof routes['sales.cash_sessions.system_amounts']
      close: typeof routes['sales.cash_sessions.close']
    }
    debts: {
      index: typeof routes['sales.debts.index']
    }
    recoveries: {
      overview: typeof routes['sales.recoveries.overview']
      store: typeof routes['sales.recoveries.store']
    }
    index: typeof routes['sales.index']
    create: typeof routes['sales.create']
    history: typeof routes['sales.history']
    store: typeof routes['sales.store']
    show: typeof routes['sales.show']
    cancel: typeof routes['sales.cancel']
  }
  management: typeof routes['management']
  journalisations: {
    getJournalisations: typeof routes['journalisations.get_journalisations']
  }
  users: {
    get: typeof routes['users.get']
    store: typeof routes['users.store']
    update: typeof routes['users.update']
    destroy: typeof routes['users.destroy']
  }
  exchangeRates: {
    get: typeof routes['exchange_rates.get']
    store: typeof routes['exchange_rates.store']
  }
  productCategories: {
    index: typeof routes['product_categories.index']
    store: typeof routes['product_categories.store']
    update: typeof routes['product_categories.update']
    destroy: typeof routes['product_categories.destroy']
  }
  productServices: {
    index: typeof routes['product_services.index']
    activeForSale: typeof routes['product_services.active_for_sale']
    store: typeof routes['product_services.store']
    update: typeof routes['product_services.update']
    destroy: typeof routes['product_services.destroy']
  }
}

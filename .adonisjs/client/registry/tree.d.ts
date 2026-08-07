/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
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
      create: typeof routes['sales.cash_sessions.create']
      store: typeof routes['sales.cash_sessions.store']
      systemAmounts: typeof routes['sales.cash_sessions.system_amounts']
      close: typeof routes['sales.cash_sessions.close']
    }
    debts: {
      index: typeof routes['sales.debts.index']
    }
    index: typeof routes['sales.index']
    create: typeof routes['sales.create']
    store: typeof routes['sales.store']
    show: typeof routes['sales.show']
    cancel: typeof routes['sales.cancel']
    recoveries: {
      index: typeof routes['sales.recoveries.index']
      store: typeof routes['sales.recoveries.store']
    }
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

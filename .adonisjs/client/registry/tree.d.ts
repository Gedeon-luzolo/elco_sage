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
  stockMovements: {
    index: typeof routes['stock_movements.index']
    store: typeof routes['stock_movements.store']
    validatePhysical: typeof routes['stock_movements.validate_physical']
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
    store: typeof routes['product_services.store']
    update: typeof routes['product_services.update']
    destroy: typeof routes['product_services.destroy']
  }
}

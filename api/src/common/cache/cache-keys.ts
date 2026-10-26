// Durées de vie du cache, en millisecondes.
export const CacheTtl = {
  MEDIUM: 2 * 60_000,
  LONG: 30 * 60_000,
  VERY_LONG: 60 * 60_000,
  ONE_DAY: 24 * 60 * 60_000,
  TWO_WEEKS: 14 * 24 * 60 * 60_000,
  ONE_MONTH: 30 * 24 * 60 * 60_000,
} as const;

/**
 * Centralise les clés du cache applicatif : un préfixe par domaine pour tout invalider d'un coup.
 */
export const CacheKeys = {
  exchangeRates: {
    current: 'exchange_rates:current',
    history: (limit: number) => `exchange_rates:history:${limit}`,
    prefix: 'exchange_rates:',
  },
  productCategories: {
    overview: 'product_categories:overview',
    active: 'product_categories:active',
    prefix: 'product_categories:',
  },
  productServices: {
    overview: 'product_services:overview',
    activeForSale: 'product_services:active_for_sale',
    prefix: 'product_services:',
  },
  customers: {
    overview: 'customers:overview',
    activeForSale: 'customers:active_for_sale',
    prefix: 'customers:',
  },
  users: {
    overview: (limit: number) => `users:overview:${limit}`,
    activeOperatorsForSale: 'users:active_operators_for_sale',
    prefix: 'users:',
  },
  sales: { prefix: 'sales:' },
  debts: { prefix: 'debts:' },
  recoveries: { prefix: 'recoveries:' },
  cashSessions: { prefix: 'cash_sessions:' },
} as const;

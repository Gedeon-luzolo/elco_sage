export const CacheTtl = {
  MEDIUM: 2 * 60_000, // 2 minutes
  LONG: 30 * 60_000, // 30 minutes
  VERY_LONG: 60 * 60_000, // 1 heure
  ONE_DAY: 24 * 60 * 60_000, // 1 jour
  TWO_DAYS: 2 * 24 * 60 * 60_000, // 2 jours
  TWO_WEEKS: 14 * 24 * 60 * 60_000, // 2 semaines
  ONE_MONTH: 30 * 24 * 60 * 60_000, // 1 mois approx.
} as const

/**
 * Centralise les cles utilisees par le cache applicatif.
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
    activeForSale: (stockDate: string) => `product_services:active_for_sale:${stockDate}`,
    prefix: 'product_services:',
    activeForSalePrefix: 'product_services:active_for_sale:',
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
  stock: {
    daily: (date: string) => `stock:daily:${date}`,
    saleSnapshot: (date: string, productId: string) => `stock:sale_snapshot:${date}:${productId}`,
    dailyPrefix: 'stock:daily:',
    saleSnapshotByDatePrefix: (date: string) => `stock:sale_snapshot:${date}:`,
    prefix: 'stock:',
  },
  sales: {
    prefix: 'sales:',
  },
  debts: {
    prefix: 'debts:',
  },
  recoveries: {
    prefix: 'recoveries:',
  },
  cashSessions: {
    prefix: 'cash_sessions:',
  },
} as const

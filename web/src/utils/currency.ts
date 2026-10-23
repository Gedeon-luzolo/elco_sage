// enumération pour les devises utilisées dans l'application
export enum Currency {
  USD = 'USD',
  CDF = 'CDF',
}

// Liste des valeurs de devise pour les types et validations
export const CURRENCY_VALUES = ['USD', 'CDF'] as const

// Type union pour les devises, basé sur la liste des valeurs
export type CurrencyCode = (typeof CURRENCY_VALUES)[number]

// Options pre-formatees pour les selects de devise.
export const CURRENCY_OPTIONS = CURRENCY_VALUES.map((currency) => ({
  label: currency,
  value: currency,
}))

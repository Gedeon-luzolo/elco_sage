import { CurrencyCode } from './currency'

// Formate 
export const formatNumber = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return '0'
  const numValue = Number(value)
  return numValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export const formatMoneyWithCurrency = (value: number, currency: CurrencyCode): string => {
  const formattedValue = formatNumber(value)

  switch (currency) {
    case 'USD':
      return `${formattedValue} $`
    case 'CDF':
      return `${formattedValue} FC`
    default:
      return formattedValue
  }
}

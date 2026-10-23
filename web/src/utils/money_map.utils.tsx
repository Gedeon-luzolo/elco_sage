import { CURRENCY_VALUES } from '~/utils/currency'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

// Forme frontend des montants multi-devise reçus depuis les DTO Inertia.
export type MoneyMap = Record<string, number>

// Rend une map monétaire sous la forme: 240 $ + 110,000 FC.
export function renderMoneyMap(values: MoneyMap | null | undefined) {
  if (!values || typeof values !== 'object') {
    return <span>0</span>
  }

  // L'ordre d'affichage vient de la source globale des devises.
  const entries = CURRENCY_VALUES.map((currency) => {
    const amount = Number(values[currency])

    return [currency, amount] as const
  }).filter(([, amount]) => Number.isFinite(amount) && amount !== 0)

  if (entries.length === 0) {
    return <span>-</span>
  }

  return (
    <>
      {entries.map(([currency, amount], index) => (
        <span key={currency}>
          {index > 0 && ' + '}
          {formatMoneyWithCurrency(amount, currency)}
        </span>
      ))}
    </>
  )
}

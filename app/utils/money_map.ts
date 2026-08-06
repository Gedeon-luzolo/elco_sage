import { Currency } from '#types/currency'

// Représente plusieurs montants sans conversion: { CDF: 110000, USD: 240 }.
export type MoneyMap = Partial<Record<Currency, number>>

// Forme DTO pour l'exposition via Inertia, qui ne doit jamais contenir de valeurs nulles.
export type MoneyMapDTO = Record<string, number>

// Version texte utilisée côté serveur, notamment dans les messages de journalisation.
export function currencySymbol(currency: string) {
  switch (currency) {
    case Currency.USD:
      return '$'
    case Currency.CDF:
      return 'FC'
    default:
      return currency
  }
}

// Garantit que les deux devises attendues existent toujours dans les DTO exposés.
export function normalizeMoneyMap(values: Record<string, number> | null | undefined): MoneyMap {
  return {
    [Currency.CDF]: Number(values?.[Currency.CDF] ?? 0),
    [Currency.USD]: Number(values?.[Currency.USD] ?? 0),
  }
}

// Construit une map en ignorant les devises que l'utilisateur n'a pas saisies.
export function buildMoneyMap(values: Record<Currency, number | null | undefined>): MoneyMap {
  return Object.entries(values).reduce<MoneyMap>((amounts, [currency, amount]) => {
    if (amount !== null && amount !== undefined) {
      amounts[currency as Currency] = Number(amount)
    }

    return amounts
  }, {})
}

// Compare les montants comptés aux montants système, devise par devise.
export function buildDifferenceMoneyMap(closingAmounts: MoneyMap, systemAmounts: MoneyMap) {
  return Object.entries(closingAmounts).reduce<MoneyMap>((differences, [currency, amount]) => {
    const currencyKey = currency as Currency

    // L'ecart reste absent pour une devise non comptee par le caissier.
    differences[currencyKey] = Number(amount) - Number(systemAmounts[currencyKey] ?? 0)

    return differences
  }, {})
}

// Rend une map monétaire en texte simple pour les logs: 240 $ + 110,000 FC.
export function renderMoneyMap(values: MoneyMap | null | undefined) {
  if (!values || typeof values !== 'object') {
    return '0'
  }

  const entries = Object.values(Currency)
    .map((currency) => [currency, values[currency]] as const)
    .filter(([, amount]) => Number(amount) > 0)

  if (entries.length === 0) {
    return '-'
  }

  return entries
    .map(([currency, amount]) => `${formatMoneyValue(amount)} ${currencySymbol(currency)}`)
    .join(' + ')
}

// Garde le même format numérique que le frontend, sans dépendre de React.
function formatMoneyValue(value: number | undefined) {
  return Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

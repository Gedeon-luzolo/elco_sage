import { Currency } from '#types/currency'

// Représente plusieurs montants sans conversion: { CDF: 110000, USD: 240 }.
export type MoneyMap = Partial<Record<Currency, number>>

// Forme DTO pour l'exposition via Inertia, qui ne doit jamais contenir de valeurs nulles.
export type MoneyMapDTO = Record<string, number>

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

// Retourne une map monetaire normalisee avec toutes les devises attendues.
export function emptyMoneyMap(): MoneyMapDTO {
  return normalizeMoneyMap({}) as MoneyMapDTO
}

// Ajoute un montant dans une map monetaire normalisée
export function addMoneyAmount(amounts: MoneyMapDTO, currency: Currency | string, value: number) {
  amounts[currency] = Number(amounts[currency] ?? 0) + Number(value || 0)
}

// Additionne une liste de montants en les groupant par devise.
export function sumMoneyByCurrency<T>(
  items: T[],
  getCurrency: (item: T) => Currency | string,
  getAmount: (item: T) => number
): MoneyMap {
  return items.reduce<MoneyMap>((amounts, item) => {
    // La devise reste une clé de groupement: aucune conversion n'est faite ici.
    const currency = getCurrency(item) as Currency

    // Le backend renvoie seulement des nombres; le formatage reste côté frontend.
    amounts[currency] = Number(amounts[currency] ?? 0) + Number(getAmount(item) || 0)

    return amounts
  }, {})
}

// Construit une map d'ecarts entre les montants comptés par le caissier et ceux calculés par le systeme.
// Additionne plusieurs maps monetaires sans convertir les devises.
export function sumMoneyMaps(...maps: Array<MoneyMap | null | undefined>): MoneyMap {
  return maps.reduce<MoneyMap>((totals, map) => {
    // Une map absente ne contribue pas au total.
    if (!map) {
      return totals
    }

    // Chaque entree garde sa devise d'origine.
    for (const [currency, amount] of Object.entries(map)) {
      const currencyKey = currency as Currency

      totals[currencyKey] = Number(totals[currencyKey] ?? 0) + Number(amount ?? 0)
    }

    return totals
  }, {})
}

export function buildDifferenceMoneyMap(closingAmounts: MoneyMap, systemAmounts: MoneyMap) {
  return Object.entries(closingAmounts).reduce<MoneyMap>((differences, [currency, amount]) => {
    const currencyKey = currency as Currency

    // L'ecart reste absent pour une devise non comptee par le caissier.
    differences[currencyKey] = Number(amount) - Number(systemAmounts[currencyKey] ?? 0)

    return differences
  }, {})
}

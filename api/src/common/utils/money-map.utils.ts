import { Currency } from '../enums/currency.enum.js';
import type { MoneyMap } from '../types/money-map.type.js';

/**
 * Arrondit un montant au centime, comme les colonnes numeric(15, 2).
 */
export function roundAmount(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Garantit une valeur pour chaque devise : la SPA reçoit toujours CDF et USD.
 */
export function normalizeMoneyMap(values: MoneyMap | null | undefined) {
  return {
    [Currency.CDF]: Number(values?.[Currency.CDF] ?? 0),
    [Currency.USD]: Number(values?.[Currency.USD] ?? 0),
  };
}

/**
 * Additionne des montants en les groupant par devise, sans conversion.
 */
export function sumMoneyByCurrency<T>(
  items: T[],
  getCurrency: (item: T) => Currency,
  getAmount: (item: T) => number,
) {
  const amounts: MoneyMap = {};

  for (const item of items) {
    // La devise n'est qu'une clé de regroupement.
    const currency = getCurrency(item);
    amounts[currency] = roundAmount((amounts[currency] ?? 0) + getAmount(item));
  }

  return amounts;
}

/**
 * Additionne plusieurs maps devise par devise.
 */
export function sumMoneyMaps(...maps: MoneyMap[]) {
  const totals: MoneyMap = {};

  for (const map of maps) {
    for (const [currency, amount] of Object.entries(map)) {
      // Chaque montant reste dans sa devise d'origine.
      const key = currency as Currency;
      totals[key] = roundAmount((totals[key] ?? 0) + amount);
    }
  }

  return totals;
}

/**
 * Montants saisis par devise : une devise non saisie reste absente.
 */
export function buildMoneyMap(values: Record<Currency, number | null>) {
  const amounts: MoneyMap = {};

  for (const [currency, amount] of Object.entries(values)) {
    // Une devise laissée vide n'apparaît pas dans la map.
    if (amount !== null) {
      amounts[currency as Currency] = amount;
    }
  }

  return amounts;
}

/**
 * Écart entre les montants comptés et ceux attendus, pour les seules devises comptées.
 */
export function buildDifferenceMoneyMap(
  closingAmounts: MoneyMap,
  systemAmounts: MoneyMap,
) {
  const differences: MoneyMap = {};

  for (const [currency, amount] of Object.entries(closingAmounts)) {
    // Un écart positif signale un excédent, négatif un manque.
    differences[currency as Currency] =
      amount - (systemAmounts[currency as Currency] ?? 0);
  }

  return differences;
}

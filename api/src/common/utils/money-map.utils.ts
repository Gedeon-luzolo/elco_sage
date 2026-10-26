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

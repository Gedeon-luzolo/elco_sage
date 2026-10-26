import type { Currency } from '../enums/currency.enum.js';

export type MoneyMap = Partial<Record<Currency, number>>;

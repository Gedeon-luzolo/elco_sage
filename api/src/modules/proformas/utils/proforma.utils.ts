import {
  dayRange,
  monthStartKey,
  toDateKey,
} from '../../../common/utils/date.utils.js';

// Nombre maximum de proformas renvoyées par lot dans la liste.
export const PROFORMAS_MAX_BATCH = 40;

// Verrou qui sérialise l'attribution des numéros de proforma, libéré à la fin de la transaction.
export const PROFORMA_NUMBER_LOCK = `SELECT pg_advisory_xact_lock(hashtext('proformas_number'))`;

// Colonnes des relations jointes : de quoi afficher la proforma et son PDF, rien de plus.
export const PROFORMA_CUSTOMER_FIELDS = ['customer.id', 'customer.fullName'];

export type NextNumberRow = { next_number: number };

// Émise : modifiable ; convertie : une vente en est issue ; annulée : gardée dans la liste.
export enum ProformaStatus {
  ISSUED = 'ISSUED',
  CONVERTED = 'CONVERTED',
  CANCELLED = 'CANCELLED',
}

/**
 * Début du mois d'une date et début du mois suivant, à l'heure de Kinshasa :
 * les bornes dans lesquelles se cherche le prochain numéro de proforma.
 */
export function proformaMonthRange(date: Date) {
  const startKey = monthStartKey(toDateKey(date));
  const [year, month] = startKey.split('-').map(Number);
  // Premier jour du mois suivant (décembre passe à janvier de l'année suivante).
  const nextKey =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  return { start: dayRange(startKey).start, end: dayRange(nextKey).start };
}

/**
 * Référence affichée d'une proforma : numéro sur 3 chiffres, mois et année (ex : « 001/10/26 »).
 */
export function formatProformaNumber(number: number, issuedAt: Date) {
  const [year, month] = toDateKey(issuedAt).split('-');

  return `${String(number).padStart(3, '0')}/${month}/${year.slice(2)}`;
}

import { QueryFailedError } from 'typeorm';

// Code PostgreSQL d'une ligne encore référencée par une clé étrangère.
const FOREIGN_KEY_VIOLATION = '23503';

// Code PostgreSQL d'une valeur déjà prise par une contrainte d'unicité.
const UNIQUE_VIOLATION = '23505';

// Code et contrainte portés par l'erreur du pilote PostgreSQL.
function driverError(error: unknown) {
  return error instanceof QueryFailedError
    ? (error.driverError as { code?: string; constraint?: string } | undefined)
    : undefined;
}

/**
 * Vrai si la base a refusé l'opération parce que la ligne est encore utilisée ailleurs.
 */
export function isForeignKeyViolation(error: unknown) {
  return driverError(error)?.code === FOREIGN_KEY_VIOLATION;
}

/**
 * Vrai si la base a refusé une valeur déjà prise (sur une contrainte précise si elle est donnée).
 */
export function isUniqueViolation(error: unknown, constraint?: string) {
  const details = driverError(error);

  // Sans contrainte précisée, toute violation d'unicité correspond.
  return (
    details?.code === UNIQUE_VIOLATION &&
    (!constraint || details.constraint === constraint)
  );
}

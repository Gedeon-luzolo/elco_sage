import { QueryFailedError } from 'typeorm';

// Code PostgreSQL d'une ligne encore référencée par une clé étrangère.
const FOREIGN_KEY_VIOLATION = '23503';

/**
 * Vrai si la base a refusé l'opération parce que la ligne est encore utilisée ailleurs.
 */
export function isForeignKeyViolation(error: unknown) {
  return (
    // Le code d'erreur PostgreSQL est porté par l'erreur du pilote.
    // Le code d'erreur PostgreSQL est porté par l'erreur du pilote.
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code ===
      FOREIGN_KEY_VIOLATION
  );
}

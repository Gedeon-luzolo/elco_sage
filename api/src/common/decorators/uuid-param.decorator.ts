import { NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';

/**
 * Lit un paramètre de route qui doit être un UUID (par défaut :id).
 * Un identifiant mal formé ne peut désigner aucune ligne : on répond 404 sans toucher la base.
 */
export const UuidParam = (name = 'id') =>
  Param(
    name,
    new ParseUUIDPipe({
      exceptionFactory: () =>
        new NotFoundException("La ressource demandée n'existe pas."),
    }),
  );

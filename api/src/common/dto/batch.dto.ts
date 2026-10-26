import { z } from 'zod';

// Lot d'une liste paginée : une valeur invalide est ignorée, pas refusée, et la limite par défaut s'applique.
export const BatchSchema = z.object({
  offset: z.coerce.number().int().min(0).optional().catch(undefined),
  limit: z.coerce.number().int().min(1).optional().catch(undefined),
});

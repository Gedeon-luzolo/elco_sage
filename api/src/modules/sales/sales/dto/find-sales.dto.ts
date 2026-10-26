import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateKey, optional } from '../../../../common/utils/zod.utils.js';
import { SaleStatus } from '../enums/sale.enums.js';

// Lot d'historique : une valeur de pagination ou un statut invalides sont ignorés, pas refusés.
export const FindSalesSchema = z.object({
  offset: z.coerce.number().int().min(0).optional().catch(undefined),
  limit: z.coerce.number().int().min(1).optional().catch(undefined),
  facturationDate: optional(dateKey('La date de facturation')),
  additionNumber: optional(z.string().trim().max(6)),
  status: z.enum(SaleStatus).optional().catch(undefined),
});

// DTO Nest généré depuis le schéma Zod.
export class FindSalesDto extends createZodDto(FindSalesSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { BatchSchema } from '../../../../common/dto/batch.dto.js';
import { dateKey, optional } from '../../../../common/utils/zod.utils.js';
import { SaleStatus } from '../enums/sale.enums.js';

// Lot d'historique : une valeur de pagination ou un statut invalides sont ignorés, pas refusés.
export const FindSalesSchema = BatchSchema.extend({
  facturationDate: optional(dateKey('La date de facturation')),
  search: optional(z.string().trim().max(10)),
  status: z.enum(SaleStatus).optional().catch(undefined),
});

// DTO Nest généré depuis le schéma Zod.
export class FindSalesDto extends createZodDto(FindSalesSchema) {}

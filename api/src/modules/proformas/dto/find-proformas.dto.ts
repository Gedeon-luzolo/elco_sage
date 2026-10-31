import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { BatchSchema } from '../../../common/dto/batch.dto.js';
import { optional } from '../../../common/utils/zod.utils.js';
import { ProformaStatus } from '../utils/proforma.utils.js';

// Lot de la liste : une valeur de pagination ou un statut invalides sont ignorés, pas refusés.
export const FindProformasSchema = BatchSchema.extend({
  search: optional(z.string().trim().max(150)),
  status: z.enum(ProformaStatus).optional().catch(undefined),
});

// DTO Nest généré depuis le schéma Zod.
export class FindProformasDto extends createZodDto(FindProformasSchema) {}

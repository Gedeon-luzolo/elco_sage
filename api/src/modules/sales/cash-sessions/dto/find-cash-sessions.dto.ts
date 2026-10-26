import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateKey, optional } from '../../../../common/utils/zod.utils.js';

// Période facultative : appliquée seulement si les deux bornes sont fournies.
export const FindCashSessionsSchema = z.object({
  startDate: optional(dateKey('La date de début')),
  endDate: optional(dateKey('La date de fin')),
});

// DTO Nest généré depuis le schéma Zod.
export class FindCashSessionsDto extends createZodDto(FindCashSessionsSchema) {}

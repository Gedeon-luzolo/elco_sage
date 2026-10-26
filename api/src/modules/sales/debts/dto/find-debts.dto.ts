import { createZodDto } from 'nestjs-zod';
import { PeriodSchema } from '../../../../common/dto/period.dto.js';
import { booleanLike, optional } from '../../../../common/utils/zod.utils.js';

// Les dettes soldées ne sont listées que sur demande ; une valeur invalide est ignorée.
export const FindDebtsSchema = PeriodSchema.extend({
  includePaid: optional(booleanLike("L'affichage des dettes soldées")).catch(
    undefined,
  ),
});

// DTO Nest généré depuis le schéma Zod.
export class FindDebtsDto extends createZodDto(FindDebtsSchema) {}

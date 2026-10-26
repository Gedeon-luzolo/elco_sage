import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { BatchSchema } from '../../../common/dto/batch.dto.js';
import { PeriodSchema } from '../../../common/dto/period.dto.js';
import { JournalisationModule } from '../enums/journalisation-module.enum.js';

// Lot du journal, filtrable par période et par module ; un module inconnu est ignoré.
export const FindJournalisationsSchema = BatchSchema.extend(
  PeriodSchema.shape,
).extend({
  module: z.enum(JournalisationModule).optional().catch(undefined),
});

// DTO Nest généré depuis le schéma Zod.
export class FindJournalisationsDto extends createZodDto(
  FindJournalisationsSchema,
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateKey, optional } from '../utils/zod.utils.js';

// Période facultative d'une liste : appliquée seulement si les deux bornes sont fournies.
export const PeriodSchema = z.object({
  startDate: optional(dateKey('La date de début')),
  endDate: optional(dateKey('La date de fin')),
});

// DTO Nest généré depuis le schéma Zod.
export class PeriodDto extends createZodDto(PeriodSchema) {}

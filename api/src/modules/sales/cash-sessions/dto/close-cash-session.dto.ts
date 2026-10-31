import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  nonNegativeNumber,
  nullable,
  nullableText,
} from '../../../../common/utils/zod.utils.js';

// Montants comptés dans le tiroir : une devise peut rester vide, pas les deux (vérifié par le service).
// La note est facultative.
export const CloseCashSessionSchema = z.object({
  closingAmountCdf: nullable(nonNegativeNumber('Le montant compté en CDF')),
  closingAmountUsd: nullable(nonNegativeNumber('Le montant compté en USD')),
  closingNote: nullableText('La note de clôture', 1000),
});

// DTO Nest généré depuis le schéma Zod.
export class CloseCashSessionDto extends createZodDto(CloseCashSessionSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { numberLike } from '../../../common/utils/zod.utils.js';

// Les deux taux restent positifs pour protéger les conversions.
export const CreateExchangeRateSchema = z.object({
  exchangeRate: numberLike('Le taux de change est requis.').pipe(
    z.number().positive('Le taux de change doit être positif.'),
  ),
  sellRate: numberLike('Le taux de vente est requis.').pipe(
    z.number().positive('Le taux de vente doit être positif.'),
  ),
});

// DTO Nest généré depuis le schéma Zod.
export class CreateExchangeRateDto extends createZodDto(
  CreateExchangeRateSchema,
) {}

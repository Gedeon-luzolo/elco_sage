import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { positiveNumber } from '../../../common/utils/zod.utils.js';

// Les deux taux restent positifs pour protéger les conversions.
export const CreateExchangeRateSchema = z.object({
  exchangeRate: positiveNumber('Le taux de change'),
  sellRate: positiveNumber('Le taux de vente'),
});

// DTO Nest généré depuis le schéma Zod.
export class CreateExchangeRateDto extends createZodDto(
  CreateExchangeRateSchema,
) {}

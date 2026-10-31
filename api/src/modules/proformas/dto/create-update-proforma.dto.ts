import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  nonNegativeNumber,
  nullable,
  positiveNumber,
  requiredCurrency,
  requiredUuid,
} from '../../../common/utils/zod.utils.js';

// Une ligne ne porte que le service et la quantité : le prix est relu côté serveur.
const proformaItemSchema = z.object({
  productServiceId: requiredUuid('Le service'),
  quantity: positiveNumber('La quantité'),
});

export const CreateUpdateProformaSchema = z.object({
  customerId: requiredUuid('Le client'),
  currency: requiredCurrency,
  discountAmount: nullable(nonNegativeNumber('La remise')),
  items: z
    .array(proformaItemSchema, {
      error: 'Ajoutez au moins un service à la proforma.',
    })
    .min(1, 'Ajoutez au moins un service à la proforma.'),
});

// DTO Nest généré depuis le schéma Zod.
export class CreateUpdateProformaDto extends createZodDto(
  CreateUpdateProformaSchema,
) {}

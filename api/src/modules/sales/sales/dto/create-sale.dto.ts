import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaymentMethod } from '../../../../common/enums/payment-method.enum.js';
import {
  isoDateTime,
  nonNegativeNumber,
  nullable,
  nullableText,
  nullableUuid,
  positiveNumber,
  requiredCurrency,
  requiredEnum,
  requiredUuid,
} from '../../../../common/utils/zod.utils.js';
import { SalePaymentType } from '../enums/sale.enums.js';

// Une ligne ne porte que le service et la quantité : le prix est relu côté serveur.
const saleItemSchema = z.object({
  productServiceId: requiredUuid('Le service'),
  quantity: positiveNumber('La quantité'),
});

export const CreateSaleSchema = z
  .object({
    // Fournis par la caisse hors ligne : l'id rend l'envoi rejouable, le numéro vient de sa plage.
    id: z.uuid("L'identifiant de la vente est invalide.").optional(),
    additionNumber: z
      .string()
      .regex(/^\d{1,6}$/, "Le numéro d'addition est invalide.")
      .optional(),
    proformaId: nullableUuid('La proforma'),
    cashSessionId: nullableUuid('La session de caisse'),
    customerId: nullableUuid('Le client'),
    operatorId: requiredUuid("L'opérateur"),
    paymentType: requiredEnum(SalePaymentType, 'Le type de paiement'),
    paymentMethod: nullable(requiredEnum(PaymentMethod, 'Le mode de paiement')),
    paymentReference: nullableText('La référence de paiement', 100),
    saleDate: nullable(isoDateTime('La date de vente')),
    currency: requiredCurrency,
    discountAmount: nullable(nonNegativeNumber('La remise')),
    items: z
      .array(saleItemSchema, {
        error: 'Ajoutez au moins un service à la vente.',
      })
      .min(1, 'Ajoutez au moins un service à la vente.'),
  })
  // Une vente payée tout de suite doit dire comment elle l'a été.
  .refine(
    (sale) =>
      sale.paymentType !== SalePaymentType.CASH || sale.paymentMethod !== null,
    {
      path: ['paymentMethod'],
      message: 'Le mode de paiement est obligatoire.',
    },
  );

// DTO Nest généré depuis le schéma Zod.
export class CreateSaleDto extends createZodDto(CreateSaleSchema) {}

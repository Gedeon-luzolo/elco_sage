import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaymentMethod } from '../../../../common/enums/payment-method.enum.js';
import {
  isoDateTime,
  nullable,
  nullableText,
  positiveNumber,
  requiredCurrency,
  requiredEnum,
} from '../../../../common/utils/zod.utils.js';

export const CreateSaleRecoverySchema = z.object({
  // Fourni par la caisse hors ligne : il rend l'envoi rejouable sans doublon.
  id: z.uuid("L'identifiant du recouvrement est invalide.").optional(),
  amount: positiveNumber('Le montant'),
  currency: requiredCurrency,
  paymentMethod: requiredEnum(PaymentMethod, 'Le mode de paiement'),
  paymentReference: nullableText('La référence de paiement', 100),
  recoveredAt: nullable(isoDateTime('La date du recouvrement')),
});

// DTO Nest généré depuis le schéma Zod.
export class CreateSaleRecoveryDto extends createZodDto(
  CreateSaleRecoverySchema,
) {}

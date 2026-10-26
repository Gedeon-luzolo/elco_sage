import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  isActiveField,
  nullableEmail,
  nullableText,
  requiredEnum,
  requiredText,
} from '../../../common/utils/zod.utils.js';
import { CustomerType } from '../enums/customer-type.enum.js';

// Champs communs à la création et à l'édition d'un client.
const customerFields = {
  fullName: requiredText('Le nom complet', { min: 2, max: 150 }),
  customerType: requiredEnum(CustomerType, 'Le type de client'),
  phoneNumber: nullableText('Le numéro de téléphone', 30),
  email: nullableEmail,
};

// Pas de statut à la création : un nouveau client est toujours actif.
export const CreateCustomerSchema = z.object(customerFields);

// En édition, le formulaire présente toujours le statut.
export const UpdateCustomerSchema = z.object({
  ...customerFields,
  isActive: isActiveField,
});

// DTO Nest générés depuis les schémas Zod.
export class CreateCustomerDto extends createZodDto(CreateCustomerSchema) {}
export class UpdateCustomerDto extends createZodDto(UpdateCustomerSchema) {}

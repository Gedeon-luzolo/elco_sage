import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  isActiveField,
  nonNegativeNumber,
  nullablePositiveInt,
  nullableText,
  nullableUuid,
  requiredCurrency,
  requiredEnum,
  requiredText,
} from '../../../../common/utils/zod.utils.js';
import { ProductServiceType } from '../enums/product-service-type.enum.js';

// Un seul prix est saisi, dans la devise choisie : l'autre est calculé avec le taux courant.
const productServiceFields = {
  type: requiredEnum(ProductServiceType, "Le type d'article"),
  name: requiredText('Le nom', { min: 2, max: 150 }),
  categoryId: nullableUuid('La catégorie choisie'),
  stockProductId: nullableUuid('Le produit lié'),
  baseUnit: nullableText("L'unité de base", 50),
  packagingUnit: nullableText("L'unité de conditionnement", 50),
  packagingCapacity: nullablePositiveInt('La capacité du conditionnement'),
  price: nonNegativeNumber('Le prix'),
  currency: requiredCurrency,
};

export const CreateProductServiceSchema = z.object(productServiceFields);

// En édition, le formulaire présente toujours le statut.
export const UpdateProductServiceSchema = z.object({
  ...productServiceFields,
  isActive: isActiveField,
});

// DTO Nest générés depuis les schémas Zod.
export class CreateProductServiceDto extends createZodDto(
  CreateProductServiceSchema,
) {}
export class UpdateProductServiceDto extends createZodDto(
  UpdateProductServiceSchema,
) {}

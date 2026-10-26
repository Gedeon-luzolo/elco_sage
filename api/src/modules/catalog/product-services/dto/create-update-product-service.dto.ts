import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Currency } from '../../../../common/enums/currency.enum.js';
import {
  booleanLike,
  nullableNumberLike,
  nullableText,
  numberLike,
} from '../../../../common/utils/zod.utils.js';
import { ProductServiceType } from '../enums/product-service-type.enum.js';

// Un seul prix est saisi, dans la devise choisie : l'autre est calculé avec le taux courant.
const productServiceFields = {
  type: z.nativeEnum(ProductServiceType, {
    error: "Le type d'article est invalide.",
  }),
  name: z
    .string({ error: 'Le nom est requis.' })
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(150, 'Le nom ne doit pas dépasser 150 caractères.'),
  categoryId: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.string().uuid('La catégorie choisie est invalide.').nullable(),
  ),
  baseUnit: nullableText(
    50,
    "L'unité de base ne doit pas dépasser 50 caractères.",
  ),
  packagingUnit: nullableText(
    50,
    "L'unité de conditionnement ne doit pas dépasser 50 caractères.",
  ),
  packagingCapacity: nullableNumberLike(
    'La capacité du conditionnement est invalide.',
  ).pipe(
    z
      .number()
      .int()
      .min(1, 'La capacité du conditionnement doit être au moins 1.')
      .nullable(),
  ),
  price: numberLike('Le prix est requis.').pipe(
    z.number().min(0, 'Le prix doit être positif ou nul.'),
  ),
  currency: z.nativeEnum(Currency, {
    error: 'La devise choisie est invalide.',
  }),
};

export const CreateProductServiceSchema = z.object(productServiceFields);

// En édition, le formulaire présente toujours le statut.
export const UpdateProductServiceSchema = z.object({
  ...productServiceFields,
  isActive: booleanLike('Le statut est invalide.'),
});

// DTO Nest générés depuis les schémas Zod.
export class CreateProductServiceDto extends createZodDto(
  CreateProductServiceSchema,
) {}
export class UpdateProductServiceDto extends createZodDto(
  UpdateProductServiceSchema,
) {}

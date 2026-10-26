import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { booleanLike } from '../../../../common/utils/zod.utils.js';

const name = z
  .string({ error: 'Le nom est requis.' })
  .trim()
  .min(2, 'Le nom doit contenir au moins 2 caractères.')
  .max(100, 'Le nom ne doit pas dépasser 100 caractères.');

// Pas de statut à la création : une nouvelle catégorie est toujours active.
export const CreateProductCategorySchema = z.object({ name });

// En édition, le formulaire présente toujours le statut.
export const UpdateProductCategorySchema = z.object({
  name,
  isActive: booleanLike('Le statut est invalide.'),
});

// DTO Nest générés depuis les schémas Zod.
export class CreateProductCategoryDto extends createZodDto(
  CreateProductCategorySchema,
) {}
export class UpdateProductCategoryDto extends createZodDto(
  UpdateProductCategorySchema,
) {}

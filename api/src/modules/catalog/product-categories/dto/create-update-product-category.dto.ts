import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  isActiveField,
  requiredText,
} from '../../../../common/utils/zod.utils.js';

const name = requiredText('Le nom', { min: 2, max: 100 });

// Pas de statut à la création : une nouvelle catégorie est toujours active.
export const CreateProductCategorySchema = z.object({ name });

// En édition, le formulaire présente toujours le statut.
export const UpdateProductCategorySchema = z.object({
  name,
  isActive: isActiveField,
});

// DTO Nest générés depuis les schémas Zod.
export class CreateProductCategoryDto extends createZodDto(
  CreateProductCategorySchema,
) {}
export class UpdateProductCategoryDto extends createZodDto(
  UpdateProductCategorySchema,
) {}

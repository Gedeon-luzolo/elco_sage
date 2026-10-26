import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  nullableText,
  requiredEmail,
  requiredEnum,
} from '../../../common/utils/zod.utils.js';
import { UserRole, UserStatus } from '../enums/user.enums.js';

const userFields = {
  fullName: nullableText('Le nom complet', 255),
  email: requiredEmail,
  role: requiredEnum(UserRole, 'Le rôle choisi'),
};

const status = requiredEnum(UserStatus, 'Le statut choisi');

// Le statut est facultatif à la création : un nouveau compte est actif.
export const CreateUserSchema = z.object({
  ...userFields,
  status: status.optional(),
});

// En édition, le formulaire présente toujours le statut.
export const UpdateUserSchema = z.object({ ...userFields, status });

// DTO Nest générés depuis les schémas Zod.
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  booleanLike,
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
const hasSystemAccess = booleanLike("L'accès au système");

// Statut et accès sont facultatifs à la création : le service applique leurs valeurs par défaut.
export const CreateUserSchema = z.object({
  ...userFields,
  status: status.optional(),
  hasSystemAccess: hasSystemAccess.optional(),
});

// En édition, le formulaire présente toujours le statut et l'accès.
export const UpdateUserSchema = z.object({
  ...userFields,
  status,
  hasSystemAccess,
});

// DTO Nest générés depuis les schémas Zod.
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

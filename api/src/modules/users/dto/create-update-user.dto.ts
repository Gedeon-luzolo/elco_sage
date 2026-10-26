import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserRole, UserStatus } from '../enums/user.enums.js';

const userFields = {
  fullName: z
    .string({ error: 'Le nom complet est invalide.' })
    .trim()
    .max(255)
    .nullable(),
  email: z
    .string({ error: "L'adresse email est requise." })
    .trim()
    .email("L'adresse email est invalide.")
    .max(254, "L'adresse email ne doit pas dépasser 254 caractères."),
  role: z.nativeEnum(UserRole, { error: 'Le rôle choisi est invalide.' }),
};

// Le statut est facultatif à la création : un nouveau compte est actif.
export const CreateUserSchema = z.object({
  ...userFields,
  status: z
    .nativeEnum(UserStatus, { error: 'Le statut choisi est invalide.' })
    .optional(),
});

// En édition, le formulaire présente toujours le statut.
export const UpdateUserSchema = z.object({
  ...userFields,
  status: z.nativeEnum(UserStatus, { error: 'Le statut choisi est invalide.' }),
});

// DTO Nest générés depuis les schémas Zod.
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

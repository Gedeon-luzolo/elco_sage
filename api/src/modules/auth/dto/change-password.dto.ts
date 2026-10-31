import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ChangePasswordSchema = z.object({
  // Les mots de passe ne sont pas nettoyés : leurs espaces font partie du secret.
  currentPassword: z
    .string({ error: 'Le mot de passe actuel est obligatoire.' })
    .min(1, 'Le mot de passe actuel est obligatoire.')
    .max(255, 'Le mot de passe ne doit pas dépasser 255 caractères.'),
  newPassword: z
    .string({ error: 'Le nouveau mot de passe est obligatoire.' })
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.')
    .max(255, 'Le mot de passe ne doit pas dépasser 255 caractères.'),
});

// DTO Nest généré depuis le schéma Zod.
export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}

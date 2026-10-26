import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { requiredEmail } from '../../../common/utils/zod.utils.js';

export const LoginSchema = z.object({
  email: requiredEmail,
  // Le mot de passe n'est pas nettoyé : ses espaces font partie du secret.
  password: z
    .string({ error: 'Le mot de passe est obligatoire.' })
    .min(1, 'Le mot de passe est obligatoire.')
    .max(255, 'Le mot de passe ne doit pas dépasser 255 caractères.'),
});

// DTO Nest généré depuis le schéma Zod.
export class LoginDto extends createZodDto(LoginSchema) {}

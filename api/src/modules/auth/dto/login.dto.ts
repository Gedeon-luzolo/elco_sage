import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().trim().email("L'adresse email est invalide."),
  password: z
    .string({ error: 'Le mot de passe est requis.' })
    .min(1, 'Le mot de passe est requis.')
    .max(255, 'Le mot de passe ne doit pas dépasser 255 caractères.'),
});

// DTO Nest généré depuis le schéma Zod.
export class LoginDto extends createZodDto(LoginSchema) {}

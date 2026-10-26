import { z } from 'zod';

// Les formulaires envoyés en FormData arrivent en texte : ces briques acceptent "12" comme 12.

// Nombre obligatoire, envoyé en nombre ou en texte.
export const numberLike = (message: string) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
    z.number({ error: message }).refine(Number.isFinite, message),
  );

// Nombre facultatif : vide, null ou absent deviennent null.
export const nullableNumberLike = (message: string) =>
  z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    numberLike(message).nullable(),
  );

// Booléen envoyé en booléen ou en texte ("true", "false", "1", "0", "on").
export const booleanLike = (message: string) =>
  z.preprocess(
    (value) => {
      if (value === 'true' || value === '1' || value === 'on') return true;
      if (value === 'false' || value === '0') return false;
      return value;
    },
    z.boolean({ error: message }),
  );

// Texte facultatif : une chaîne vide devient null.
export const nullableText = (max: number, message: string) =>
  z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.string().trim().max(max, message).nullable(),
  );

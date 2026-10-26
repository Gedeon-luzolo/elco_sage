import { z } from 'zod';
import { Currency } from '../enums/currency.enum.js';
// Vrai pour une valeur non saisie : absente, nulle ou vide.
const isMissing = (input: unknown) =>
  input === undefined || input === null || input === '';

// Une chaîne vide ou un champ absent deviennent null avant la validation.
const emptyToNull = (value: unknown) =>
  value === '' || value === undefined ? null : value;

// Champ facultatif : vide, absent ou null donnent null, sinon le schéma s'applique.
export const nullable = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess(emptyToNull, schema.nullable());

// Filtre de requête facultatif : vide ou absent donnent undefined (le filtre est ignoré).
export const optional = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess(
    (value) => (value === '' ? undefined : value),
    schema.optional(),
  );

// Texte obligatoire, nettoyé de ses espaces, entre min et max caractères.
export const requiredText = (
  label: string,
  { min = 1, max }: { min?: number; max: number },
) =>
  z
    .string({ error: `${label} est obligatoire.` })
    .trim()
    // Un champ vide n'affiche que « obligatoire », pas aussi la longueur minimale.
    .min(1, { error: `${label} est obligatoire.`, abort: true })
    .min(min, `${label} doit contenir au moins ${min} caractères.`)
    .max(max, `${label} ne doit pas dépasser ${max} caractères.`);

// Texte facultatif : une chaîne vide devient null.
export const nullableText = (label: string, max: number) =>
  nullable(
    z
      .string({ error: `${label} est invalide.` })
      .trim()
      .max(max, `${label} ne doit pas dépasser ${max} caractères.`),
  );

// Adresse email obligatoire, limitée à la longueur maximale standard.
export const requiredEmail = z
  .string({ error: "L'adresse email est obligatoire." })
  .trim()
  .pipe(
    z
      .email("L'adresse email est invalide.")
      .max(254, "L'adresse email ne doit pas dépasser 254 caractères."),
  );

// Adresse email facultative : vide ou absente devient null (les espaces seuls aussi).
export const nullableEmail = z.preprocess(
  (value) => emptyToNull(typeof value === 'string' ? value.trim() : value),
  requiredEmail.nullable(),
);

// Valeur obligatoire parmi celles d'une énumération.
export const requiredEnum = <Values extends Record<string, string>>(
  values: Values,
  label: string,
) =>
  z.enum(values, {
    // Absent : obligatoire ; hors de la liste : invalide.
    error: (issue) =>
      isMissing(issue.input)
        ? `${label} est obligatoire.`
        : `${label} est invalide.`,
  });

// Devise de la caisse, toujours obligatoire.
export const requiredCurrency = requiredEnum(Currency, 'La devise choisie');

// Identifiant obligatoire d'une autre ligne (opérateur, service…).
export const requiredUuid = (label: string) =>
  z.uuid({
    // Absent : obligatoire ; mal formé : invalide.
    error: (issue) =>
      isMissing(issue.input)
        ? `${label} est obligatoire.`
        : `${label} est invalide.`,
  });

// Identifiant facultatif d'une autre ligne (catégorie, client…).
export const nullableUuid = (label: string) =>
  nullable(z.uuid(`${label} est invalide.`));

// Jour au format YYYY-MM-DD, utilisé par les filtres de période.
export const dateKey = (label: string) =>
  z.iso.date({ error: `${label} est invalide.` });

// Date et heure ISO 8601 (avec Z ou un décalage horaire).
export const isoDateTime = (label: string) =>
  z.iso.datetime({ offset: true, error: `${label} est invalide.` });

// Nombre obligatoire, envoyé en nombre ou en texte.
export const numberLike = (label: string) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
    z
      .number({
        // Absent : obligatoire ; texte non numérique (NaN) : pas un nombre.
        error: (issue) =>
          isMissing(issue.input)
            ? `${label} est obligatoire.`
            : `${label} doit être un nombre.`,
      })
      .refine(Number.isFinite, `${label} doit être un nombre.`),
  );

// Montant ou taux strictement positif.
export const positiveNumber = (label: string) =>
  numberLike(label).pipe(
    z.number().positive(`${label} doit être un nombre positif.`),
  );

// Montant positif ou nul (un prix peut valoir 0).
export const nonNegativeNumber = (label: string) =>
  numberLike(label).pipe(
    z.number().min(0, `${label} doit être un nombre positif ou nul.`),
  );

// Entier facultatif d'au moins 1 (capacité, quantité…) : vide devient null.
export const nullablePositiveInt = (label: string) =>
  nullable(
    numberLike(label).pipe(
      z
        .number()
        .int(`${label} doit être un nombre entier.`)
        .min(1, `${label} doit valoir au moins 1.`),
    ),
  );

// Booléen envoyé en booléen ou en texte ("true", "false", "1", "0", "on").
export const booleanLike = (label: string) =>
  z.preprocess(
    (value) => {
      if (value === 'true' || value === '1' || value === 'on') return true;
      if (value === 'false' || value === '0') return false;
      return value;
    },
    z.boolean({ error: `${label} est invalide.` }),
  );

// Statut actif / inactif, toujours présenté par les formulaires d'édition.
export const isActiveField = booleanLike('Le statut');

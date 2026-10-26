import {
  type PipeTransform,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';

type ZodIssueLike = {
  message?: string;
  path?: Array<string | number>;
};

// Normalise les erreurs Zod.
const getZodIssues = (error: unknown): ZodIssueLike[] => {
  if (!error || typeof error !== 'object' || !('issues' in error)) {
    return [];
  }

  const issues = (error as { issues?: unknown }).issues;

  return Array.isArray(issues) ? (issues as ZodIssueLike[]) : [];
};

/**
 * Pipe global Zod pour les DTO.
 * Même réponse que l'API Adonis : 422 avec le premier message et la liste { field, message }.
 */
export const AppZodValidationPipe: new () => PipeTransform =
  createZodValidationPipe({
    createValidationException: (error) => {
      const issues = getZodIssues(error);

      return new UnprocessableEntityException({
        message: issues[0]?.message || 'Les données envoyées sont invalides.',
        errors: issues.map((issue) => ({
          field: (issue.path ?? []).join('.'),
          message: issue.message,
        })),
      });
    },
  });

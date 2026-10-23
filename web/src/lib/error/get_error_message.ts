import { ApiError } from '~/lib/api/fetch'

// Message lisible pour l'utilisateur, quelle que soit l'origine de l'erreur.
export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return error instanceof Error ? error.message : 'Une erreur est survenue.'
}

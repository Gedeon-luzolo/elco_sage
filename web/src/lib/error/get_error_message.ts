import { ApiError } from '~/lib/api/fetch'

// Statuts pour lesquels le message du backend est ecrit par nous, donc affichable tel quel.
const BACKEND_MESSAGE_STATUSES = [400, 401, 409, 422]

// Messages fixes en francais pour les autres statuts.
const STATUS_MESSAGES: Record<number, string> = {
  403: "Accès non autorisé. Vous n'avez pas les permissions nécessaires.",
  404: "La ressource demandée n'existe pas.",
  429: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
  500: 'Erreur serveur. Veuillez réessayer plus tard.',
}

const FALLBACK_MESSAGE = "Une erreur inattendue s'est produite. Veuillez réessayer."

/** Transforme n'importe quelle erreur en message lisible par l'utilisateur. */
export const getErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return FALLBACK_MESSAGE
  }

  // Statut 0 = le serveur n'a pas repondu (reseau coupe, backend arrete).
  if (error.status === 0) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
  }

  if (BACKEND_MESSAGE_STATUSES.includes(error.status)) {
    return error.message
  }

  return STATUS_MESSAGES[error.status] ?? FALLBACK_MESSAGE
}

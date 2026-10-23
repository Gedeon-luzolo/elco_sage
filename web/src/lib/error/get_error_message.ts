import { ApiError } from '~/lib/api/fetch'

// Statuts pour lesquels le message du backend est écrit par nous, donc affichable tel quel.
const BACKEND_MESSAGE_STATUSES = [400, 401, 409, 422]

// Messages fixes en français pour les autres statuts.
const STATUS_MESSAGES: Record<number, string> = {
  403: "Accès non autorisé. Vous n'avez pas les permissions nécessaires.",
  404: "La ressource demandée n'existe pas.",
  429: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
  500: 'Erreur serveur. Veuillez réessayer plus tard.',
}

const FALLBACK_MESSAGE = "Une erreur inattendue s'est produite. Veuillez réessayer."

// Transforme n'importe quelle erreur en message lisible par l'utilisateur.
export const getErrorMessage = (error: unknown): string => {
  // Les erreurs qui ne viennent pas de l'API n'ont pas de message présentable
  if (!(error instanceof ApiError)) {
    return FALLBACK_MESSAGE
  }

  // Statut 0 : le serveur n'a pas répondu (réseau coupé, backend arrêté)
  if (error.status === 0) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
  }

  // Ces statuts portent un message déjà écrit pour l'utilisateur
  if (BACKEND_MESSAGE_STATUSES.includes(error.status)) {
    return error.message
  }

  return STATUS_MESSAGES[error.status] ?? FALLBACK_MESSAGE
}

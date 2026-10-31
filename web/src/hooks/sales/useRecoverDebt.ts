import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '~/hooks/auth/useAuth'
import { getErrorMessage } from '~/lib/error/get_error_message'
import { OFFLINE_QUERY_PREFIXES } from '~/lib/offline/config'
import { submitOrQueue } from '~/lib/offline/submit'
import { invalidateQueriesByPrefix } from '~/lib/react-query/query_client'

// Données d'un recouvrement : la vente concernée, son numéro (pour le libellé) et le corps de la requête.
interface RecoverDebtVariables {
  saleId: string
  saleNumber: string
  payload: Record<string, unknown>
}

// Enregistre un recouvrement en ligne, ou le met dans la file d'attente si le serveur ne répond pas.
export function useRecoverDebt() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ saleId, saleNumber, payload }: RecoverDebtVariables) => {
      // L'id généré ici rend l'envoi rejouable sans doublon
      const id = crypto.randomUUID()

      return submitOrQueue({
        id,
        type: 'recovery',
        userId: user!.id,
        path: `/sales/${saleId}/recoveries`,
        body: { ...payload, id },
        summary: `Recouvrement sur la facture ${saleNumber}`,
        sale: null,
      })
    },
    onSuccess: (result) => {
      // Recouvrement gardé sur l'appareil : il n'est pas encore envoyé
      if (result.queued) {
        toast.warning('Recouvrement enregistré hors ligne. Il sera envoyé dès le retour du réseau.')
        return
      }

      toast.success('Recouvrement enregistré avec succès.')
      // Un recouvrement modifie la dette, la caisse et les rapports
      invalidateQueriesByPrefix(OFFLINE_QUERY_PREFIXES)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

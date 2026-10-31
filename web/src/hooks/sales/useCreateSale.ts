import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '~/hooks/auth/useAuth'
import { ApiError } from '~/lib/api/fetch'
import { getErrorMessage } from '~/lib/error/get_error_message'
import { OFFLINE_QUERY_PREFIXES } from '~/lib/offline/config'
import { commitOfflineReference, peekOfflineReference } from '~/lib/offline/numbering'
import { submitOrQueue } from '~/lib/offline/submit'
import { invalidateQueriesByPrefix } from '~/lib/react-query/query_client'
import type { SaleItemRow } from '~/types/sale_types'

// Données d'une création de vente.
// payload est celui du formulaire (sans id ni référence : ils sont attribués ici).
// buildSale construit la vente locale (ticket) d'une vente mise en file, une fois sa référence connue.
interface CreateSaleVariables {
  cashSessionId: string
  payload: Record<string, unknown>
  buildSale: (meta: { id: string; offlineReference: string; saleDate: string }) => SaleItemRow
}

// Résultat d'une création de vente.
// queued vaut vrai si le serveur n'a pas répondu : la vente est dans la file et partira plus tard.
interface CreateSaleResult {
  sale: SaleItemRow
  queued: boolean
}

const NO_SELLER_CODE_MESSAGE =
  'Connectez-vous une première fois au serveur pour pouvoir vendre hors ligne.'

// Crée une vente en ligne quand le serveur répond : elle reçoit tout de suite son numéro de facture.
// Sinon la vente est mise en file avec une référence hors ligne (ex : A0009), imprimée sur le ticket
// provisoire ; le numéro de facture lui sera attribué à l'envoi.
export function useCreateSale() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      cashSessionId,
      payload,
      buildSale,
    }: CreateSaleVariables): Promise<CreateSaleResult> => {
      // L'id généré ici rend l'envoi rejouable sans doublon
      const id = crypto.randomUUID()
      const saleDate = new Date().toISOString()
      let offlineReference: string | null = null
      let queuedSale: SaleItemRow | null = null

      const result = await submitOrQueue<SaleItemRow>(
        {
          id,
          type: 'sale',
          userId: user!.id,
          path: '/sales',
          body: { ...payload, id, cashSessionId, saleDate },
          summary: 'Vente',
          sale: null,
        },
        // Serveur injoignable : la vente prend la prochaine référence du vendeur avant la mise en file
        async (operation) => {
          offlineReference = await peekOfflineReference(user!.id)

          // Sans lettre de vendeur, impossible d'imprimer un ticket identifiable
          if (!offlineReference) {
            throw new ApiError(NO_SELLER_CODE_MESSAGE, 409)
          }

          queuedSale = buildSale({ id, offlineReference, saleDate })

          return {
            ...operation,
            body: { ...operation.body, offlineReference },
            summary: `Vente ${offlineReference}`,
            sale: queuedSale,
          }
        }
      )

      if (!result.queued) {
        return { sale: result.data, queued: false }
      }

      // La référence n'est consommée qu'une fois la vente mise en file
      await commitOfflineReference(user!.id, offlineReference!)

      return { sale: queuedSale!, queued: true }
    },
    onSuccess: ({ queued }) => {
      // Vente gardée sur l'appareil : la personne doit savoir qu'elle n'est pas encore envoyée
      if (queued) {
        toast.warning('Vente enregistrée hors ligne. Elle sera envoyée dès le retour du réseau.')
        return
      }

      toast.success('Vente enregistrée avec succès.')
      // Une vente modifie la caisse, les dettes et les rapports
      invalidateQueriesByPrefix(OFFLINE_QUERY_PREFIXES)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

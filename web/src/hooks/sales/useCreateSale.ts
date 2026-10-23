import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '~/hooks/auth/useAuth'
import { ApiError } from '~/lib/api/fetch'
import { getErrorMessage } from '~/lib/error/get_error_message'
import { OFFLINE_QUERY_PREFIXES } from '~/lib/offline/config'
import { commitNumber, peekNextNumber, refreshNumbering } from '~/lib/offline/numbering'
import { submitOrQueue } from '~/lib/offline/submit'
import { invalidateQueriesByPrefix } from '~/lib/react-query/query_client'
import type { SaleItemRow } from '~/types/sale_types'

// Données d'une création de vente.
// payload est celui du formulaire (sans id ni numéro : ils sont attribués ici).
// buildSale construit la vente locale (ticket) une fois l'id et le numéro connus.
interface CreateSaleVariables {
  cashSessionId: string
  payload: Record<string, unknown>
  buildSale: (meta: { id: string; additionNumber: string; saleDate: string }) => SaleItemRow
}

// Résultat d'une création de vente.
// queued vaut vrai si le serveur n'a pas répondu : la vente est dans la file et partira plus tard.
export interface CreateSaleResult {
  sale: SaleItemRow
  queued: boolean
}

const NO_NUMBER_MESSAGE =
  "Plus de numéros d'addition disponibles. Reconnectez-vous au serveur pour en réserver."

// Crée une vente en ligne quand le serveur répond, sinon la met dans la file d'attente.
// Le numéro d'addition vient toujours de la plage réservée à la caisse, pour que le ticket
// imprimé reste valable quel que soit le chemin emprunté.
export function useCreateSale() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      cashSessionId,
      payload,
      buildSale,
    }: CreateSaleVariables): Promise<CreateSaleResult> => {
      // Prochain numéro de la plage réservée à cette caisse
      let additionNumber = await peekNextNumber(cashSessionId)

      // Plages épuisées ou jamais chargées : une tentative de réservation si le serveur répond
      if (!additionNumber) {
        await refreshNumbering(cashSessionId).catch(() => undefined)
        additionNumber = await peekNextNumber(cashSessionId)
      }

      // Sans numéro, impossible d'imprimer un ticket valable
      if (!additionNumber) {
        throw new ApiError(NO_NUMBER_MESSAGE, 409)
      }

      // L'id généré ici rend l'envoi rejouable sans doublon
      const id = crypto.randomUUID()
      const saleDate = new Date().toISOString()
      const sale = buildSale({ id, additionNumber, saleDate })

      // Envoi au serveur, ou mise en file si le réseau est coupé
      const result = await submitOrQueue<SaleItemRow>({
        id,
        type: 'sale',
        userId: user!.id,
        path: '/sales',
        body: { ...payload, id, additionNumber, cashSessionId, saleDate },
        summary: `Vente ${additionNumber}`,
        sale,
      })

      // Le numéro n'est consommé qu'une fois la vente envoyée ou mise en file
      await commitNumber(cashSessionId, additionNumber)

      return result.queued ? { sale, queued: true } : { sale: result.data, queued: false }
    },
    onSuccess: ({ queued }) => {
      // Vente gardée sur l'appareil : la personne doit savoir qu'elle n'est pas encore envoyée
      if (queued) {
        toast.warning('Vente enregistrée hors ligne. Elle sera envoyée dès le retour du réseau.')
        return
      }

      toast.success('Vente enregistrée avec succès.')
      // Une vente modifie la caisse, le stock, les dettes et les rapports
      invalidateQueriesByPrefix(OFFLINE_QUERY_PREFIXES)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

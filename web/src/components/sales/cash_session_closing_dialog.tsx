import { useQuery } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CurrencyClosingField } from '~/components/sales/currency_closing_field'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { useCrud } from '~/hooks/common/useCrud'
import { useOutbox } from '~/hooks/useOutbox'
import { api } from '~/lib/api/fetch'
import type { CashSessionItem } from '~/types/cash_session_types'
import type { MoneyMap } from '~/utils/money_map.utils'

interface CashSessionSystemAmountsResponse {
  systemAmounts: MoneyMap
}

interface CashSessionClosingDialogProps {
  open: boolean
  currentCashSession: CashSessionItem
  onOpenChange: (open: boolean) => void
}

export function CashSessionClosingDialog({
  open,
  currentCashSession,
  onOpenChange,
}: CashSessionClosingDialogProps) {
  const navigate = useNavigate()
  // Fermer la caisse avec des ventes non envoyees les exclurait du rapport de cloture.
  const unsyncedCount = useOutbox().length
  const [closingAmountCdf, setClosingAmountCdf] = useState('')
  const [closingAmountUsd, setClosingAmountUsd] = useState('')
  const [closingNote, setClosingNote] = useState('')

  // Les montants systeme sont charges a chaque ouverture du dialog (jamais servis depuis le cache).
  const { data: systemAmountsResponse, isLoading: isLoadingSystemAmounts } = useQuery({
    queryKey: ['/cash-sessions/current/system-amounts', currentCashSession.id],
    queryFn: () =>
      api.get<CashSessionSystemAmountsResponse>('/cash-sessions/current/system-amounts'),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
  })

  // La fermeture invalide la session courante, les rapports et les ventes de la caisse.
  const closeSession = useCrud<CashSessionItem>({
    endpoint: '/cash-sessions/close',
    queryKey: '/cash-sessions',
    invalidateQueries: ['/sales', '/debts', '/recoveries'],
    showSuccessToast: false,
  }).useCreate<{
    closingAmountCdf: number | null
    closingAmountUsd: number | null
    closingNote: string | null
  }>()
  const isSubmitting = closeSession.isPending

  // Tant que le GET n'a pas répondu, le dialog affiche 0 et désactive la validation.
  const systemAmounts = systemAmountsResponse?.systemAmounts ?? { CDF: 0, USD: 0 }
  const systemAmountCdf = Number(systemAmounts.CDF ?? 0)
  const systemAmountUsd = Number(systemAmounts.USD ?? 0)

  // Les montants saisis restent locaux jusqu'au clic sur "Valider la cloture".
  const parsedClosingAmountCdf = parseOptionalAmount(closingAmountCdf)
  const parsedClosingAmountUsd = parseOptionalAmount(closingAmountUsd)
  const canSubmit = parsedClosingAmountCdf !== null || parsedClosingAmountUsd !== null

  // L'ecart est recalculé instantanement dans le frontend
  const differenceAmountCdf =
    parsedClosingAmountCdf === null ? null : parsedClosingAmountCdf - systemAmountCdf
  const differenceAmountUsd =
    parsedClosingAmountUsd === null ? null : parsedClosingAmountUsd - systemAmountUsd

  // La seule mutation reseau: fermeture definitive de la session.
  const submitClosing = () => {
    // Si le formulaire n'est pas valide, on ne fait rien.
    if (!canSubmit) return

    closeSession.mutate(
      {
        closingAmountCdf: parsedClosingAmountCdf,
        closingAmountUsd: parsedClosingAmountUsd,
        // Une note laissée vide n'est pas envoyée
        closingNote: closingNote.trim() || null,
      },
      {
        onSuccess: () => {
          resetForm()
          onOpenChange(false)
          toast.success('Session de caisse fermée avec succès.')
          navigate('/sales/session/open')
        },
      }
    )
  }

  // Ferme le dialog sans mutation reseau, en laissant les montants saisis intacts.
  const closeDialog = () => {
    if (isSubmitting) return

    onOpenChange(false)
  }

  // Reinitialise les champs de saisie pour la prochaine ouverture du dialog.
  const resetForm = () => {
    setClosingAmountCdf('')
    setClosingAmountUsd('')
    setClosingNote('')
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Fermer la caisse</DialogTitle>
          <DialogDescription>
            Saisissez le montant compte. L&apos;ecart est calcule sans conversion entre devises.
          </DialogDescription>
        </DialogHeader>

        {/* Montants comptés à gauche, note à droite ; empilés sur petit écran */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-4">
            <CurrencyClosingField
              currency="CDF"
              systemAmount={systemAmountCdf}
              value={closingAmountCdf}
              difference={differenceAmountCdf}
              isLoading={isLoadingSystemAmounts}
              onChange={setClosingAmountCdf}
            />
            <CurrencyClosingField
              currency="USD"
              systemAmount={systemAmountUsd}
              value={closingAmountUsd}
              difference={differenceAmountUsd}
              isLoading={isLoadingSystemAmounts}
              onChange={setClosingAmountUsd}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="closing-note">Note (facultatif)</Label>
            <Textarea
              id="closing-note"
              className="min-h-32 flex-1"
              placeholder="Ex : écart expliqué, incident, remarque pour la direction"
              maxLength={1000}
              value={closingNote}
              onChange={(event) => setClosingNote(event.target.value)}
            />
          </div>
        </div>

        {unsyncedCount > 0 && (
          <p className="text-sm text-destructive">
            {unsyncedCount} opération(s) hors ligne ne sont pas encore envoyées. Envoyez-les avant
            de fermer la caisse.
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={submitClosing}
            disabled={!canSubmit || isSubmitting || isLoadingSystemAmounts || unsyncedCount > 0}
          >
            <Save className="size-4" />
            {isSubmitting ? 'Fermeture...' : 'Valider la cloture'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function parseOptionalAmount(value: string) {
  // Un champ vide signifie que cette devise n'a pas été comptée.
  if (value.trim() === '') {
    return null
  }

  const amount = Number(value)

  // Le backend refusera aussi les montants invalides; ceci garde juste l'UI cohérente.
  return Number.isNaN(amount) || amount < 0 ? null : amount
}

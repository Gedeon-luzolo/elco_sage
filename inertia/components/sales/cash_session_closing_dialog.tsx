import { router } from '@inertiajs/react'
import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { apiGet } from '~/lib/api_fetch'
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSystemAmounts, setIsLoadingSystemAmounts] = useState(false)
  const [systemAmountsResponse, setSystemAmountsResponse] =
    useState<CashSessionSystemAmountsResponse | null>(null)
  const [closingAmountCdf, setClosingAmountCdf] = useState('')
  const [closingAmountUsd, setClosingAmountUsd] = useState('')

  // UseEffect pour charger les montants systeme depuis le backend quand le dialog s'ouvre.
  useEffect(() => {
    if (!open) return

    const loadSystemAmounts = async () => {
      setIsLoadingSystemAmounts(true)

      try {
        // On utilise apiGet directement ici pour éviter tout GET avant l'ouverture du dialog.
        const data = await apiGet<CashSessionSystemAmountsResponse>('/sales/session/system-amounts')

        setSystemAmountsResponse(data)
      } finally {
        setIsLoadingSystemAmounts(false)
      }
    }

    void loadSystemAmounts()
  }, [open, currentCashSession.id])

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

    setIsSubmitting(true)

    // post vers le backend pour cloturer la session de caisse.
    router.post(
      '/sales/session/close',
      {
        closingAmountCdf: parsedClosingAmountCdf,
        closingAmountUsd: parsedClosingAmountUsd,
      },
      {
        onSuccess: () => {
          resetForm()
          onOpenChange(false)
        },
        onFinish: () => setIsSubmitting(false),
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
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fermer la caisse</DialogTitle>
          <DialogDescription>
            Saisissez le montant compte. L&apos;ecart est calcule sans conversion entre devises.
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={submitClosing}
            disabled={!canSubmit || isSubmitting || isLoadingSystemAmounts}
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

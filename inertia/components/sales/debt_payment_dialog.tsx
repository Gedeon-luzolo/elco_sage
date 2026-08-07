import { router } from '@inertiajs/react'
import { CreditCard } from 'lucide-react'
import { SubmitButton } from '~/components/common/submit_button'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { DebtItem } from '~/types/debt_types'
import type { CurrencyCode } from '~/utils/currency'
import { getLocalDateKey } from '~/utils/date'
import { formatDebtSaleDate } from '~/utils/sales/debt.utils'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

interface DebtPaymentDialogProps {
  debt: DebtItem | null
  redirectTo: string
  onOpenChange: (open: boolean) => void
}

export function DebtPaymentDialog({ debt, redirectTo, onOpenChange }: DebtPaymentDialogProps) {
  const saleCurrency = debt?.sale.currency as CurrencyCode | undefined

  const closeDialog = () => {
    onOpenChange(false)
  }

  const handleSubmit = (formData: FormData) => {
    if (!debt) return

    // Les champs visibles viennent du FormData, les champs de contexte viennent de la dette.
    const payload = {
      ...Object.fromEntries(formData),
      currency: debt.sale.currency,
      redirectTo,
    }

    router.post(`/sales/${debt.sale.id}/recoveries`, payload, {
      preserveScroll: true,
      onSuccess: closeDialog,
    })
  }

  return (
    <Dialog open={Boolean(debt)} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Encaisser une dette</DialogTitle>
          <DialogDescription>
            Le paiement reste dans la devise de la vente et ne peut pas depasser le reste du.
          </DialogDescription>
        </DialogHeader>

        <form key={debt?.sale.id ?? 'empty'} className="grid gap-4" action={handleSubmit}>
          {debt && (
            <>
              <div className="grid gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <DebtPaymentLine label="Client" value={debt.sale.customer?.fullName ?? '-'} />
                <DebtPaymentLine label="Addition" value={debt.sale.additionNumber} />
                <DebtPaymentLine
                  label="Date de vente"
                  value={formatDebtSaleDate(debt.sale.saleDate)}
                />
                <DebtPaymentLine label="Operateur" value={debt.sale.operatorName ?? '-'} />
                <DebtPaymentLine
                  label="Dette totale"
                  value={formatMoneyWithCurrency(debt.debtTotalAmount, saleCurrency!)}
                />
                <DebtPaymentLine
                  label="Déjà payé"
                  value={formatMoneyWithCurrency(debt.recoveredAmount, saleCurrency!)}
                />
                <DebtPaymentLine
                  label="Reste"
                  value={formatMoneyWithCurrency(debt.remainingAmount, saleCurrency!)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="debt-payment-amount">Montant encaissé</Label>
                <Input
                  id="debt-payment-amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  max={debt.remainingAmount}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="debt-payment-date">Date de paiement</Label>
                <Input
                  id="debt-payment-date"
                  name="recoveredAt"
                  type="date"
                  defaultValue={getLocalDateKey(new Date())}
                  readOnly
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <SubmitButton
              label="Encaisser"
              loadingLabel="Encaissement..."
              icon={<CreditCard className="size-4" />}
              disabled={!debt}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DebtPaymentLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

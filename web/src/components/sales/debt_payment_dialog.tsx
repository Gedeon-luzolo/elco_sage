import { CreditCard } from 'lucide-react'
import { useState } from 'react'
import { OptionSelect } from '~/components/common/option_select'
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
import { useRecoverDebt } from '~/hooks/sales/useRecoverDebt'
import type { DebtItem } from '~/types/debt_types'
import type { CurrencyCode } from '~/utils/currency'
import { todayDateKey } from '~/utils/date'
import { formatDebtSaleDate } from '~/utils/sales/debt.utils'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import {
  buildPaymentFields,
  PAYMENT_METHOD_OPTIONS,
  paymentMethodNeedsReference,
  type PaymentMethod,
} from '~/utils/sales/payment.utils'
import { getUserDisplayName } from '~/utils/user.utils'
import { getSaleNumberLabel } from '~/utils/sales/sale.utils'

interface DebtPaymentDialogProps {
  debt: DebtItem | null
  onOpenChange: (open: boolean) => void
}

export function DebtPaymentDialog({ debt, onOpenChange }: DebtPaymentDialogProps) {
  const saleCurrency = debt?.sale.currency as CurrencyCode | undefined

  // En ligne le recouvrement part au serveur ; sans réseau il va dans la file d'attente
  const recover = useRecoverDebt()

  // Le mode pilote l'affichage de la référence, il est donc gardé en état.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')

  const closeDialog = () => {
    // Le prochain encaissement repart sur les espèces.
    setPaymentMethod('CASH')
    onOpenChange(false)
  }

  const handleSubmit = (formData: FormData) => {
    if (!debt) return

    // Les champs visibles viennent du FormData, les champs de contexte viennent de la dette.
    const { paymentReference, ...fields } = Object.fromEntries(formData)
    const payload = {
      ...fields,
      ...buildPaymentFields(paymentMethod, String(paymentReference ?? '')),
      currency: debt.sale.currency,
    }

    recover.mutate(
      { saleId: debt.sale.id, saleNumber: getSaleNumberLabel(debt.sale), payload },
      { onSuccess: closeDialog }
    )
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
                <DebtPaymentLine label="Facture" value={getSaleNumberLabel(debt.sale)} />
                <DebtPaymentLine
                  label="Date de vente"
                  value={formatDebtSaleDate(debt.sale.saleDate)}
                />
                <DebtPaymentLine
                  label="Opérateur"
                  value={getUserDisplayName(debt.sale.operator) ?? '-'}
                />
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

              {/* Montant et mode côte à côte */}
              <div className="flex gap-3">
                <div className="grid min-w-0 flex-1 gap-2">
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

                <div className="grid min-w-0 flex-1 gap-2">
                  <Label htmlFor="debt-payment-method">Mode de paiement</Label>
                  <OptionSelect
                    id="debt-payment-method"
                    options={PAYMENT_METHOD_OPTIONS}
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  />
                </div>
              </div>

              {/* Pas de référence pour les espèces : rien à tracer */}
              {paymentMethodNeedsReference(paymentMethod) && (
                <div className="grid gap-2">
                  <Label htmlFor="debt-payment-reference">Référence</Label>
                  <Input
                    id="debt-payment-reference"
                    name="paymentReference"
                    placeholder="N° de transaction (facultatif)"
                    maxLength={100}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="debt-payment-date">Date de paiement</Label>
                {/* Affichage seulement : l'heure réelle de l'encaissement est ajoutée à l'envoi */}
                <Input id="debt-payment-date" type="date" defaultValue={todayDateKey()} readOnly />
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

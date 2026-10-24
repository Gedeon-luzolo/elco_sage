import { Save } from 'lucide-react'
import { SaleSummaryLine } from '~/components/sales/sale_summary_line'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { CurrencyCode } from '~/utils/currency'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

interface SaleTicketSummaryProps {
  currency: CurrencyCode
  theoreticalAmount: number
  payableAmount: number
  onPayableAmountChange: (value: number) => void
  discountAmount: number
  totalAmount: number
  canSubmit: boolean
  isSubmitting: boolean
  onSubmit: () => void
}

// Pied du ticket : montants, remise éventuelle et bouton d'enregistrement.
export function SaleTicketSummary({
  currency,
  theoreticalAmount,
  payableAmount,
  onPayableAmountChange,
  discountAmount,
  totalAmount,
  canSubmit,
  isSubmitting,
  onSubmit,
}: SaleTicketSummaryProps) {
  return (
    <div className="space-y-3 rounded-b-2xl border-t border-border bg-muted/30 p-4">
      <SaleSummaryLine
        label="Montant théorique"
        value={formatMoneyWithCurrency(theoreticalAmount, currency)}
      />

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="sale-payable-amount" className="text-muted-foreground">
          Montant à payer
        </Label>
        <Input
          id="sale-payable-amount"
          type="number"
          min="0"
          step="0.01"
          value={payableAmount}
          onChange={(event) => onPayableAmountChange(Number(event.target.value))}
          className="h-9 w-36 text-right font-semibold"
        />
      </div>

      <SaleSummaryLine
        label="Remise calculée"
        value={formatMoneyWithCurrency(discountAmount, currency)}
      />

      <div className="border-t border-dashed border-border pt-3">
        <SaleSummaryLine
          label="Total à payer"
          value={formatMoneyWithCurrency(totalAmount, currency)}
          strong
        />
      </div>

      <Button
        type="button"
        className="h-12 w-full text-base"
        disabled={!canSubmit || isSubmitting}
        onClick={onSubmit}
      >
        <Save className="size-4" />
        {isSubmitting ? 'Enregistrement...' : 'Enregistrer la vente'}
      </Button>
    </div>
  )
}

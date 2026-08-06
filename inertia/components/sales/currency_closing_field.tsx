import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import LoadingSpinner from '~/components/ui/loading_spinner'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

interface CurrencyClosingFieldProps {
  currency: 'CDF' | 'USD'
  systemAmount: number
  value: string
  difference: number | null
  isLoading?: boolean
  onChange: (value: string) => void
}

export function CurrencyClosingField({
  currency,
  systemAmount,
  value,
  difference,
  isLoading = false,
  onChange,
}: CurrencyClosingFieldProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor={`closing-${currency}`} className="text-sm font-medium">
            Montant compté en {currency}
          </Label>
          {isLoading ? (
            <LoadingSpinner size="sm" text="" className="mt-1 justify-start" />
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Systeme: {formatMoneyWithCurrency(systemAmount, currency)}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-muted-foreground">Ecart</p>
          <p className={getDifferenceClassName(difference)}>
            {difference === null ? '-' : formatMoneyWithCurrency(difference, currency)}
          </p>
        </div>
      </div>

      <Input
        id={`closing-${currency}`}
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

// Fonction pour  obtenir la difference
function getDifferenceClassName(value: number | null) {
  if (value === null || value === 0) {
    return 'text-sm font-semibold text-foreground'
  }

  return value > 0
    ? 'text-sm font-semibold text-emerald-700'
    : 'text-sm font-semibold text-destructive'
}

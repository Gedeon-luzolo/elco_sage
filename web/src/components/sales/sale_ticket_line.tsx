import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { ProductServiceDTO } from '~/types/dto'
import type { CurrencyCode } from '~/utils/currency'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import { getSaleServiceUnitPrice, type SaleLineState } from '~/utils/sales/sale.utils'

interface SaleTicketLineProps {
  line: SaleLineState
  service: ProductServiceDTO | undefined
  currency: CurrencyCode
  onChange: (patch: Partial<SaleLineState>) => void
  onRemove: () => void
}

// Une ligne du ticket : service, quantité et total.
export function SaleTicketLine({
  line,
  service,
  currency,
  onChange,
  onRemove,
}: SaleTicketLineProps) {
  const unitPrice = getSaleServiceUnitPrice(service, currency)

  return (
    <div className="space-y-2 border-b border-border py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{service?.name ?? 'Service inconnu'}</p>
          <p className="text-xs text-muted-foreground">
            {formatMoneyWithCurrency(unitPrice, currency)}
          </p>
        </div>
        <p className="shrink-0 font-semibold">
          {formatMoneyWithCurrency(unitPrice * line.quantity, currency)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Diminuer la quantité"
            className="size-9"
            onClick={() => onChange({ quantity: Math.max(line.quantity - 1, 1) })}
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-8 text-center font-bold">{line.quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Augmenter la quantité"
            className="size-9"
            onClick={() => onChange({ quantity: line.quantity + 1 })}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="icon"
          aria-label="Retirer la ligne"
          className="size-9"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

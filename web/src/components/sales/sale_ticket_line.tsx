import { Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
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
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{service?.name ?? 'Service inconnu'}</p>
        <p className="text-xs text-muted-foreground">
          {formatMoneyWithCurrency(unitPrice, currency)}
        </p>
      </div>

      {/* Saisie directe : taper 120 est plus rapide que 120 clics sur la carte */}
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        aria-label="Quantité"
        value={line.quantity || ''}
        onChange={(event) => onChange({ quantity: Number(event.target.value) })}
        onFocus={(event) => event.target.select()}
        // Un champ vidé repasse à 1 en sortie, pour ne pas laisser une ligne sans quantité
        onBlur={() => onChange({ quantity: Math.max(line.quantity, 1) })}
        className="h-9 w-20 shrink-0 text-center font-bold"
      />

      <p className="w-24 shrink-0 text-right font-semibold">
        {formatMoneyWithCurrency(unitPrice * line.quantity, currency)}
      </p>

      <Button
        type="button"
        variant="destructive"
        size="icon"
        aria-label="Retirer la ligne"
        className="size-9 shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

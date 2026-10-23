import { Printer, XCircle } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { SaleItemRow } from '~/types/sale_types'
import type { CurrencyCode } from '~/utils/currency'
import { formatDateTimeLabel } from '~/utils/date'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

interface SaleDetailPanelProps {
  sale: SaleItemRow
  canCancelSale?: boolean
  onPrintSale?: (sale: SaleItemRow) => void
  onCancelSale?: (sale: SaleItemRow) => void
}

/**
 * Panneau de detail d'une vente selectionnee.
 */
export function SaleDetailPanel({
  sale,
  canCancelSale = false,
  onPrintSale,
  onCancelSale,
}: SaleDetailPanelProps) {
  const isCancelled = sale.status === 'CANCELLED'

  return (
    <aside className="h-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">Addition {sale.additionNumber}</h3>
          <p className="text-sm text-muted-foreground">{formatDateTimeLabel(sale.saleDate)}</p>
        </div>
        {/* Actions tactiles : pleine largeur en mobile, compactes en desktop. */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onPrintSale?.(sale)}
          >
            <Printer className="size-4" />
            Imprimer
          </Button>

          {canCancelSale && !isCancelled && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => onCancelSale?.(sale)}
            >
              <XCircle className="size-4" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <DetailLine label="Client" value={sale.customer?.fullName ?? '-'} />
          <DetailLine label="Operateur" value={sale.operatorName ?? '-'} />
          <DetailLine label="Vendeur" value={sale.sellerName ?? '-'} />
          <DetailLine label="Paiement" value={sale.paymentType} />
          <DetailLine label="Statut" value={sale.status} />
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <DetailLine
            label="Montant theorique"
            value={formatMoneyWithCurrency(sale.theoreticalAmount, sale.currency as CurrencyCode)}
          />
          <DetailLine
            label="Remise"
            value={formatMoneyWithCurrency(sale.discountAmount, sale.currency as CurrencyCode)}
          />
          <DetailLine
            label="Total"
            value={formatMoneyWithCurrency(sale.totalAmount, sale.currency as CurrencyCode)}
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <h4 className="text-sm font-semibold">Services vendus</h4>
          <div className="mt-3 space-y-3">
            {sale.items.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-background p-3 text-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.productService?.name ?? 'Service inconnu'}</p>
                    <p className="text-xs text-muted-foreground">
                      Bon : {item.orderNumber} - Quantite : {item.quantity}{' '}
                      {item.productService?.stockProductBaseUnit ?? ''}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">
                    {formatMoneyWithCurrency(item.totalPrice, item.currency as CurrencyCode)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium">{value}</span>
    </div>
  )
}

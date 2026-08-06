import type { SaleItemRow } from '~/types/sale_types'
import { formatSaleDate, formatSaleMoney } from '~/utils/sales/sale.utils'

interface SaleDetailPanelProps {
  sale: SaleItemRow
}

/**
 * Panneau de detail d'une vente selectionnee.
 */
export function SaleDetailPanel({ sale }: SaleDetailPanelProps) {
  return (
    <aside className="h-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
      <div className="sticky top-0 z-10 border-b border-border bg-card p-4">
        <h3 className="text-lg font-semibold">Addition {sale.additionNumber}</h3>
        <p className="text-sm text-muted-foreground">{formatSaleDate(sale.saleDate)}</p>
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
            value={formatSaleMoney(sale.theoreticalAmount, sale.currency)}
          />
          <DetailLine label="Remise" value={formatSaleMoney(sale.discountAmount, sale.currency)} />
          <DetailLine label="Total" value={formatSaleMoney(sale.totalAmount, sale.currency)} />
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <h4 className="text-sm font-semibold">Services vendus</h4>
          <div className="mt-3 space-y-3">
            {sale.items.map((item) => (
              <div key={item.id} className="rounded-md border border-border bg-background p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.productService?.name ?? 'Service inconnu'}</p>
                    <p className="text-xs text-muted-foreground">
                      Bon : {item.orderNumber} - Quantite : {item.quantity}{' '}
                      {item.productService?.baseUnit ?? ''}
                    </p>
                  </div>
                  <p className="font-semibold">{formatSaleMoney(item.totalPrice, item.currency)}</p>
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
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

import { Printer, XCircle } from 'lucide-react'
import { InvoicePdfDownload } from '~/components/invoices/invoice_pdf_download'
import { ThermalSaleReceipt } from '~/components/sales/thermal_sale_receipt'
import { Button } from '~/components/ui/button'
import type { SaleItemRow } from '~/types/sale_types'
import { formatDateTimeLabel } from '~/utils/date'
import { saleToInvoice } from '~/utils/invoices/invoice.utils'

// Propriétés du panneau ; isPending marque une vente faite hors ligne et pas encore envoyée.
interface SaleDetailPanelProps {
  sale: SaleItemRow
  isPending?: boolean
  canCancelSale?: boolean
  onPrintSale?: (sale: SaleItemRow) => void
  onCancelSale?: (sale: SaleItemRow) => void
}

/**
 * Panneau d'une vente sélectionnée : ses actions, puis son ticket thermique.
 */
export function SaleDetailPanel({
  sale,
  isPending = false,
  canCancelSale = false,
  onPrintSale,
  onCancelSale,
}: SaleDetailPanelProps) {
  const isCancelled = sale.status === 'CANCELLED'

  return (
    <aside className="h-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-card p-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">Addition {sale.additionNumber}</h3>
          <p className="text-sm text-muted-foreground">{formatDateTimeLabel(sale.saleDate)}</p>
        </div>
        {/* Actions sous le titre : elles se partagent la largeur du panneau étroit */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onPrintSale?.(sale)}
          >
            <Printer className="size-4" />
            Imprimer
          </Button>

          {/* Facture A4 pour les clients qui la demandent, en plus du ticket */}
          <InvoicePdfDownload invoice={saleToInvoice(sale)} label="Facture A4" className="flex-1" />

          {canCancelSale && !isCancelled && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => onCancelSale?.(sale)}
            >
              <XCircle className="size-4" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 p-4">
        {/* Cette vente n'existe que sur l'appareil : elle ne peut pas encore être annulée */}
        {isPending && (
          <p className="w-full rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            Vente faite hors ligne
          </p>
        )}

        {/* Le ticket de l'imprimante thermique en petit format, un peu agrandi pour l'écran : même contenu, logo réduit */}
        <div className="relative drop-shadow-md [zoom:1.25]">
          <ThermalSaleReceipt sale={sale} compact />

          {/* Une vente annulée garde son ticket, barré d'un tampon */}
          {isCancelled && (
            <span className="absolute top-16 right-3 rotate-12 rounded border-2 border-red-700 bg-white/70 px-2 py-0.5 text-sm font-extrabold tracking-wider text-red-700 uppercase">
              Annulée
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}

import { Pencil, ShoppingCart, XCircle } from 'lucide-react'
import { InvoicePdfDownload } from '~/components/invoices/invoice_pdf_download'
import { Button } from '~/components/ui/button'
import type { ProformaRow } from '~/types/proforma_types'
import { proformaToInvoice } from '~/utils/invoices/invoice.utils'

// canConvert est faux sans caisse ouverte : la vente issue de la proforma passe par la caisse.
interface ProformaActionsProps {
  proforma: ProformaRow
  canConvert: boolean
  onEdit: (proforma: ProformaRow) => void
  onConvert: (proforma: ProformaRow) => void
  onCancel: (proforma: ProformaRow) => void
}

/**
 * Actions d'une proforma : PDF toujours ; modifier, convertir et annuler tant qu'elle est émise.
 */
export function ProformaActions({
  proforma,
  canConvert,
  onEdit,
  onConvert,
  onCancel,
}: ProformaActionsProps) {
  // Seule une proforma émise se modifie, se convertit ou s'annule
  const isIssued = proforma.status === 'ISSUED'

  return (
    <>
      <InvoicePdfDownload invoice={proformaToInvoice(proforma)} className="w-full sm:w-auto" />

      {isIssued && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onEdit(proforma)}
          >
            <Pencil className="size-4" />
            Modifier
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            disabled={!canConvert}
            title={canConvert ? undefined : 'Ouvrez une session de caisse pour convertir'}
            onClick={() => onConvert(proforma)}
          >
            <ShoppingCart className="size-4" />
            Convertir en vente
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onCancel(proforma)}
          >
            <XCircle className="size-4" />
            Annuler
          </Button>
        </>
      )}
    </>
  )
}

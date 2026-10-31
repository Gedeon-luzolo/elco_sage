import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { getErrorMessage } from '~/lib/error/get_error_message'
import { downloadPdf, toFileName } from '~/lib/pdf/download_pdf'
import type { InvoiceDocument } from '~/utils/invoices/invoice.utils'

interface InvoicePdfDownloadProps {
  invoice: InvoiceDocument
  label?: string
  className?: string
}

// Bouton qui génère la facture A4 dans le navigateur et la télécharge en PDF.
export function InvoicePdfDownload({
  invoice,
  label = 'Télécharger PDF',
  className,
}: InvoicePdfDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePdf = async () => {
    setIsGenerating(true)

    try {
      // Le gabarit de facture n'est chargé qu'au premier clic, comme le moteur PDF
      await downloadPdf(
        async () => {
          const { InvoicePdfDocument } = await import('~/components/invoices/invoice_pdf_document')
          return <InvoicePdfDocument invoice={invoice} />
        },
        toFileName([invoice.title, invoice.reference], 'pdf')
      )
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={isGenerating}
      onClick={() => void generatePdf()}
    >
      <Download className="size-4" />
      {isGenerating ? 'Génération...' : label}
    </Button>
  )
}

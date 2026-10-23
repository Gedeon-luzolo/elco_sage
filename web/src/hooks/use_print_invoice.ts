import { useCallback, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useReactToPrint } from 'react-to-print'
import type { SaleItemRow } from '~/types/sale_types'

interface UsePrintInvoiceOptions {
  selectedSale: SaleItemRow | null
  onSelectSale: (saleId: string) => void
  // Vente a imprimer des qu'elle est chargee (ex: la vente qui vient d'etre enregistree).
  autoPrintSaleId?: string | null
  onAutoPrinted?: () => void
}

export function usePrintInvoice({
  selectedSale,
  onSelectSale,
  autoPrintSaleId = null,
  onAutoPrinted,
}: UsePrintInvoiceOptions) {
  // Ce ref doit pointer vers le DOM exact que react-to-print va cloner.
  const receiptRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    onAfterPrint: onAutoPrinted,
  })

  const printInvoice = useCallback(
    (sale: SaleItemRow) => {
      // flushSync force selectedSale à changer avant que react-to-print clone le contenu.
      flushSync(() => onSelectSale(sale.id))
      handlePrint()
    },
    [handlePrint, onSelectSale]
  )

  // Si une vente est a imprimer automatiquement et qu'elle est selectionnee, on lance l'impression.
  useEffect(() => {
    if (!autoPrintSaleId || !selectedSale || selectedSale.id !== autoPrintSaleId) {
      return
    }

    handlePrint()
  }, [handlePrint, autoPrintSaleId, selectedSale])

  return {
    printInvoice,
    receiptRef,
  }
}

import { router, usePage } from '@inertiajs/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useReactToPrint } from 'react-to-print'
import type { SaleItemRow } from '~/types/sale_types'

interface UsePrintInvoiceOptions {
  selectedSale: SaleItemRow | null
  onSelectSale: (saleId: string) => void
}

export function usePrintInvoice({ selectedSale, onSelectSale }: UsePrintInvoiceOptions) {
  const { url } = usePage()

  // Ce ref doit pointer vers le DOM exact que react-to-print va cloner.
  const receiptRef = useRef<HTMLDivElement>(null)

  const printSaleId = useMemo(
    () => new URLSearchParams(url.split('?')[1] ?? '').get('printSaleId'),
    [url]
  )

  const clearAutoPrintUrl = useCallback(() => {
    if (!printSaleId) {
      return
    }

    // Apres impression auto, on retire printSaleId pour eviter une reimpression au refresh.
    router.visit('/sales', {
      replace: true,
      preserveScroll: true,
      preserveState: true,
    })
  }, [printSaleId])

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    onAfterPrint: clearAutoPrintUrl,
  })

  const printInvoice = useCallback(
    (sale: SaleItemRow) => {
      // flushSync force selectedSale a changer avant que react-to-print clone le contenu.
      flushSync(() => onSelectSale(sale.id))
      handlePrint()
    },
    [handlePrint, onSelectSale]
  )

  // Si printSaleId est present dans l'URL et correspond a la vente selectionnee, on lance l'impression auto.
  useEffect(() => {
    if (!printSaleId || !selectedSale || selectedSale.id !== printSaleId) {
      return
    }

    // Cas vente reussie: la vente est deja selectionnee via printSaleId, on ouvre l'impression.
    handlePrint()
  }, [handlePrint, printSaleId, selectedSale])

  return {
    printInvoice,
    receiptRef,
  }
}

import type { ProformaRow } from '~/types/proforma_types'
import type { SaleItemRow } from '~/types/sale_types'
import { businessDateKey } from '~/utils/date'
import { formatProformaNumber } from '~/utils/sales/proforma.utils'

// Contenu d'une facture A4, qu'elle vienne d'une vente ou d'une proforma.
export interface InvoiceDocument {
  title: string
  reference: string
  customerName: string | null
  currency: string
  issuedAt: string
  lines: Array<{
    position: number
    designation: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  theoreticalAmount: number
  discountAmount: number
  totalAmount: number
}

// Facture proforma : sa référence et ses désignations saisies.
export function proformaToInvoice(proforma: ProformaRow): InvoiceDocument {
  return {
    title: 'FACTURE PROFORMA',
    reference: formatProformaNumber(proforma),
    customerName: proforma.customer?.fullName ?? null,
    currency: proforma.currency,
    issuedAt: proforma.issuedAt,
    lines: proforma.items.map((item) => ({
      position: item.position,
      designation: item.designation,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    theoreticalAmount: proforma.theoreticalAmount,
    discountAmount: proforma.discountAmount,
    totalAmount: proforma.totalAmount,
  }
}

// Facture d'une vente : numéro d'addition, mois et année de la vente (ex : « 123/10/26 »).
export function saleToInvoice(sale: SaleItemRow): InvoiceDocument {
  const [year, month] = businessDateKey(sale.saleDate).split('-')

  return {
    title: 'FACTURE',
    reference: `${Number(sale.additionNumber)}/${month}/${year.slice(2)}`,
    customerName: sale.customer?.fullName ?? null,
    currency: sale.currency,
    issuedAt: sale.saleDate,
    lines: sale.items.map((item, index) => ({
      position: index + 1,
      designation: item.productService?.name ?? 'Service',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    theoreticalAmount: sale.theoreticalAmount,
    discountAmount: sale.discountAmount,
    totalAmount: sale.totalAmount,
  }
}

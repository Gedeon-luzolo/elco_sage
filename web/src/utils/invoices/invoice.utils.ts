import type { ProformaRow } from '~/types/proforma_types'
import type { SaleItemRow } from '~/types/sale_types'
import { formatProformaNumber } from '~/utils/sales/proforma.utils'
import { getSaleNumberLabel } from '~/utils/sales/sale.utils'

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
  note: string | null
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
    note: null,
  }
}

// Facture d'une vente : son numéro officiel (ex : « 00001 »).
// Tant que la vente faite hors ligne n'est pas envoyée, le document est une commande et porte le numéro
// de l'appareil ; une fois la facture numérotée, ce numéro de commande est rappelé en bas.
export function saleToInvoice(sale: SaleItemRow): InvoiceDocument {
  const isProvisional = sale.invoiceNumber === null

  return {
    title: isProvisional ? 'COMMANDE' : 'FACTURE',
    reference: getSaleNumberLabel(sale),
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
    // Seule une facture numérotée rappelle sa commande ; la commande porte déjà ce numéro en titre
    note: !isProvisional && sale.offlineReference ? `Commande : ${sale.offlineReference}` : null,
  }
}

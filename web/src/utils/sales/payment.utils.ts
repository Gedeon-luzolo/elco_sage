export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'BANK_CARD' | 'CHEQUE'

// Options affichées dans le select du mode de paiement.
export const PAYMENT_METHOD_OPTIONS: Array<{ label: string; value: PaymentMethod }> = [
  { label: 'Espèces', value: 'CASH' },
  { label: 'Mobile money', value: 'MOBILE_MONEY' },
  { label: 'Virement bancaire', value: 'BANK_TRANSFER' },
  { label: 'Carte bancaire', value: 'BANK_CARD' },
  { label: 'Chèque', value: 'CHEQUE' },
]

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Cash',
  CREDIT: 'Credit',
  OFFERED: 'Offert',
}

// Une référence (n° de transaction, de chèque...) n'a de sens que hors espèces.
export function paymentMethodNeedsReference(method: string | null | undefined) {
  return Boolean(method) && method !== 'CASH'
}

// Libellé lisible d'un mode de paiement, « - » quand il n'y en a pas.
export function formatPaymentMethodLabel(method: string | null | undefined) {
  return PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? '-'
}

// Libellé d'une vente : le type, suivi du mode quand la vente a été payée tout de suite.
export function formatSalePaymentLabel(sale: {
  paymentType: string
  paymentMethod?: string | null
}) {
  const typeLabel = PAYMENT_TYPE_LABELS[sale.paymentType] ?? sale.paymentType

  return sale.paymentMethod
    ? `${typeLabel} · ${formatPaymentMethodLabel(sale.paymentMethod)}`
    : typeLabel
}

// Le mode et la référence envoyés au serveur : la référence est vidée pour les espèces.
export function buildPaymentFields(method: PaymentMethod, reference: string) {
  return {
    paymentMethod: method,
    paymentReference: paymentMethodNeedsReference(method) ? reference.trim() || null : null,
  }
}

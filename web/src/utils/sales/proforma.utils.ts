import type { SaleLineState } from '~/utils/sales/sale.utils'
import type { ProformaRow, ProformaStatus } from '~/types/proforma_types'
import { businessDateKey } from '~/utils/date'

export const PROFORMA_STATUS_LABELS: Record<ProformaStatus, string> = {
  ISSUED: 'Émise',
  CONVERTED: 'Convertie',
  CANCELLED: 'Annulée',
}

// Options du filtre de statut, alignées sur l'enum backend ProformaStatus.
export const PROFORMA_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'ISSUED', label: 'Émises' },
  { value: 'CONVERTED', label: 'Converties' },
  { value: 'CANCELLED', label: 'Annulées' },
] as const

// Référence d'une proforma : numéro du mois sur 3 chiffres, mois et année d'émission à Kinshasa
// (ex : « 001/10/26 »).
export function formatProformaNumber(proforma: Pick<ProformaRow, 'number' | 'issuedAt'>) {
  const [year, month] = businessDateKey(proforma.issuedAt).split('-')

  return `${String(proforma.number).padStart(3, '0')}/${month}/${year.slice(2)}`
}

// Corps attendu par POST et PUT /proformas : seules les lignes complètes sont envoyées.
export function buildProformaPayload(input: {
  customerId: string
  currency: string
  discountAmount: number
  lines: SaleLineState[]
}) {
  return {
    customerId: input.customerId,
    currency: input.currency,
    discountAmount: input.discountAmount,
    items: input.lines
      .filter((line) => line.productServiceId && line.quantity > 0)
      .map((line) => ({
        productServiceId: line.productServiceId,
        quantity: Number(line.quantity),
      })),
  }
}

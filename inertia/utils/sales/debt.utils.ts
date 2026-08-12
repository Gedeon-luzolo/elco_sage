import type { DebtItem, RecoveryPaymentItem } from '~/types/debt_types'
import { formatDateTimeLabel } from '~/utils/date'
import type { DebtStatus } from '~/types/debt_types'

// Formate une date liée aux dettes pour garder le même rendu sur page et dialog.
export function formatDebtSaleDate(value: string | null) {
  return formatDateTimeLabel(value)
}

// Libellé métier commun pour éviter de dupliquer le mapping des statuts de dette.
export function formatDebtStatusLabel(status: DebtStatus) {
  switch (status) {
    case 'UNPAID':
      return 'Non payée'
    case 'PARTIAL':
      return 'Partielle'
    case 'PAID':
      return 'Soldée'
    default:
      return status
  }
}

// Champs de recherche utilisés dans la page des dettes.
export const debtSearchFields = [
  (debt: DebtItem) => debt.sale.customer?.fullName,
  (debt: DebtItem) => debt.sale.additionNumber,
]

// Champs de recherche utilisés dans la page des paiements de recouvrement.
export const recoverySearchFields = [
  (payment: RecoveryPaymentItem) => payment.sale.customer?.fullName,
  (payment: RecoveryPaymentItem) => payment.sale.additionNumber,
]

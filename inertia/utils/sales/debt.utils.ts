import type { DebtItem, RecoveryPaymentItem } from '~/types/debt_types'
import { formatDateTimeLabel } from '~/utils/date'

// Formate une date liée aux dettes pour garder le même rendu sur page et dialog.
export function formatDebtSaleDate(value: string | null) {
  return formatDateTimeLabel(value)
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

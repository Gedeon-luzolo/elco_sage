import { DebtStatus } from '#types/debt'

// Détermine le statut d'une dette à partir du total de la vente et du montant déjà recouvré.
export function resolveDebtStatus(totalAmount: number, recoveredAmount: number) {
  if (recoveredAmount <= 0) {
    return DebtStatus.UNPAID
  }

  if (recoveredAmount >= totalAmount) {
    return DebtStatus.PAID
  }

  return DebtStatus.PARTIAL
}

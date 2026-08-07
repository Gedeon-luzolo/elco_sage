import type Sale from '#models/sale'
import type SaleRecovery from '#models/sale_recovery'
import type { MoneyMapDTO } from '#utils/money_map'

export enum DebtStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export interface FindDebtsParams {
  startDate?: string
  endDate?: string
  includePaid?: boolean
}

export interface DebtSummary {
  sale: Sale
  debtTotalAmount: number
  recoveredAmount: number
  remainingAmount: number
  debtStatus: DebtStatus
}

export interface DebtStats {
  totalDebts: number
  totalDebtAmounts: MoneyMapDTO
  recoveredAmounts: MoneyMapDTO
  remainingAmounts: MoneyMapDTO
}

export interface DebtOverview {
  debts: DebtSummary[]
  stats: DebtStats
}

//Type pour les paiements de recouvrement
export interface RecoveryPaymentSummary {
  recovery: SaleRecovery
  sale: Sale
  debtTotalAmount: number
  paidAmount: number
  paidAfterAmount: number
  remainingAmount: number
  debtStatus: DebtStatus
}

//Type pour l'aperçu des paiements de recouvrement
export interface RecoveryOverview {
  recoveries: RecoveryPaymentSummary[]
  stats: DebtStats
}

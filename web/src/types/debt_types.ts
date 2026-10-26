import type { SaleItemRow, SaleRecovery } from '~/types/sale_types'
import type { MoneyMap } from '~/utils/money_map.utils'

export type DebtStatus = 'UNPAID' | 'PARTIAL' | 'PAID'

export type DebtItem = {
  sale: SaleItemRow
  debtTotalAmount: number
  recoveredAmount: number
  remainingAmount: number
  debtStatus: DebtStatus
}

export type DebtStats = {
  totalDebts: number
  totalDebtAmounts: MoneyMap
  recoveredAmounts: MoneyMap
  remainingAmounts: MoneyMap
}

export interface DebtsPageProps {
  debts: DebtItem[]
  stats: DebtStats
  filters: {
    startDate: string | null
    endDate: string | null
  }
}

export type RecoveryPaymentItem = {
  recovery: SaleRecovery
  sale: SaleItemRow
  debtTotalAmount: number
  paidAmount: number
  paidAfterAmount: number
  remainingAmount: number
  debtStatus: DebtStatus
}

export interface RecoveriesPageProps {
  recoveries: RecoveryPaymentItem[]
  stats: DebtStats
  filters: {
    startDate: string | null
    endDate: string | null
  }
}

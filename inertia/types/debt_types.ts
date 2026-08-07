import type { JSONDataTypes } from '@adonisjs/core/types/transformers'
import type { SaleItemRow, SaleRecovery } from '~/types/sale_types'
import type { MoneyMap } from '~/utils/money_map.utils'

export type DebtStatus = 'UNPAID' | 'PARTIAL' | 'PAID'

export type DebtItem = Record<string, JSONDataTypes> & {
  sale: SaleItemRow
  debtTotalAmount: number
  recoveredAmount: number
  remainingAmount: number
  debtStatus: DebtStatus
}

export type DebtStats = Record<string, JSONDataTypes> & {
  totalDebts: number
  totalDebtAmounts: MoneyMap
  recoveredAmounts: MoneyMap
  remainingAmounts: MoneyMap
}

export interface DebtsPageProps extends Record<string, JSONDataTypes> {
  debts: DebtItem[]
  stats: DebtStats
  filters: {
    startDate: string | null
    endDate: string | null
  }
}

export type RecoveryPaymentItem = Record<string, JSONDataTypes> & {
  recovery: SaleRecovery
  sale: SaleItemRow
  debtTotalAmount: number
  paidAmount: number
  paidAfterAmount: number
  remainingAmount: number
  debtStatus: DebtStatus
}

export interface RecoveriesPageProps extends Record<string, JSONDataTypes> {
  recoveries: RecoveryPaymentItem[]
  stats: DebtStats
  filters: {
    startDate: string | null
    endDate: string | null
  }
}

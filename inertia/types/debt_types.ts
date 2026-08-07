import type { JSONDataTypes } from '@adonisjs/core/types/transformers'
import type { SaleItemRow } from '~/types/sale_types'
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

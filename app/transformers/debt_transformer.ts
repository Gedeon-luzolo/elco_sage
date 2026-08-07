import SaleTransformer, { type SaleDTO } from '#transformers/sale_transformer'
import type { DebtSummary } from '#types/debt'

export interface DebtDTO {
  sale: SaleDTO
  debtTotalAmount: number
  recoveredAmount: number
  remainingAmount: number
  debtStatus: string
}

export default class DebtTransformer {
  /**
   * Transforme une dette calculee pour la page Inertia.
   */
  public static transformSingle(debt: DebtSummary): DebtDTO {
    return {
      sale: SaleTransformer.transformSingle(debt.sale),
      debtTotalAmount: debt.debtTotalAmount,
      recoveredAmount: debt.recoveredAmount,
      remainingAmount: debt.remainingAmount,
      debtStatus: debt.debtStatus,
    }
  }

  /**
   * Transforme une liste de dettes calculees.
   */
  public static transform(debts: DebtSummary[]): DebtDTO[] {
    return debts.map((debt) => this.transformSingle(debt))
  }
}

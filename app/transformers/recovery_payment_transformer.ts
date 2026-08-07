import SaleRecoveryTransformer, {
  type SaleRecoveryDTO,
} from '#transformers/sale_recovery_transformer'
import SaleTransformer, { type SaleDTO } from '#transformers/sale_transformer'
import type { RecoveryPaymentSummary } from '#types/debt'

export interface RecoveryPaymentDTO {
  recovery: SaleRecoveryDTO
  sale: SaleDTO
  debtTotalAmount: number
  paidAmount: number
  paidAfterAmount: number
  remainingAmount: number
  debtStatus: string
}

export default class RecoveryPaymentTransformer {
  /**
   * Transforme une ligne d'historique de paiement.
   */
  public static transformSingle(item: RecoveryPaymentSummary): RecoveryPaymentDTO {
    return {
      recovery: SaleRecoveryTransformer.transformSingle(item.recovery),
      sale: SaleTransformer.transformSingle(item.sale),
      debtTotalAmount: item.debtTotalAmount,
      paidAmount: item.paidAmount,
      paidAfterAmount: item.paidAfterAmount,
      remainingAmount: item.remainingAmount,
      debtStatus: item.debtStatus,
    }
  }

  /**
   * Transforme une liste de paiements.
   */
  public static transform(items: RecoveryPaymentSummary[]): RecoveryPaymentDTO[] {
    return items.map((item) => this.transformSingle(item))
  }
}

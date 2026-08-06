import type SaleRecovery from '#models/sale_recovery'

export interface SaleRecoveryDTO {
  id: string
  saleId: string
  cashSessionId: string | null
  receivedById: string
  amount: number
  currency: string
  recoveredAt: string | null
  receivedByName: string | null
}

export default class SaleRecoveryTransformer {
  /**
   * Transforme un recouvrement de vente.
   */
  public static transformSingle(item: SaleRecovery): SaleRecoveryDTO {
    return {
      id: item.id,
      saleId: item.saleId,
      cashSessionId: item.cashSessionId,
      receivedById: item.receivedById,
      amount: item.amount,
      currency: item.currency,
      recoveredAt: item.recoveredAt?.toISO() ?? null,
      receivedByName: item.receivedBy?.fullName ?? item.receivedBy?.email ?? null,
    }
  }

  /**
   * Transforme une liste de recouvrements.
   */
  public static transform(items: SaleRecovery[]): SaleRecoveryDTO[] {
    return items.map((item) => this.transformSingle(item))
  }
}

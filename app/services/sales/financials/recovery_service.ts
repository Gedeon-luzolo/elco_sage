import type { DebtOverview, DebtStats, DebtSummary, FindDebtsParams } from '#types/debt'
import { DebtStatus } from '#types/debt'
import { normalizeMoneyMap, sumMoneyByCurrency } from '#utils/money_map'
import DebtService from '#services/sales/financials/debt_service'

const debtService = new DebtService()

export default class RecoveryService {
  /**
   * Récupère uniquement les dettes soldées sur la période demandée.
   */
  async getOverview(params: FindDebtsParams = {}): Promise<DebtOverview> {
    // Charge toutes les dettes, y compris celles qui sont deja payees.
    const debts = await debtService.findDebts({
      ...params,
      includePaid: true,
    })

    // Garde uniquement les dettes soldees pour cette vue de recouvrement.
    const paidDebts = debts.filter((debt) => debt.debtStatus === DebtStatus.PAID)

    // Retourne la liste et les statistiques numeriques attendues par Inertia.
    return {
      debts: paidDebts,
      stats: this.buildRecoveryStats(paidDebts),
    }
  }

  private buildRecoveryStats(debts: DebtSummary[]): DebtStats {
    // Somme chaque montant par devise sans formatter pour l'interface.
    const totalDebtAmounts = sumMoneyByCurrency(
      debts,
      (debt) => debt.sale.currency,
      (debt) => debt.debtTotalAmount
    )
    const recoveredAmounts = sumMoneyByCurrency(
      debts,
      (debt) => debt.sale.currency,
      (debt) => debt.recoveredAmount
    )
    const remainingAmounts = sumMoneyByCurrency(
      debts,
      (debt) => debt.sale.currency,
      (debt) => debt.remainingAmount
    )

    // Normalise les cles de devise avant d'exposer les stats au frontend.
    return {
      totalDebts: debts.length,
      totalDebtAmounts: normalizeMoneyMap(totalDebtAmounts),
      recoveredAmounts: normalizeMoneyMap(recoveredAmounts),
      remainingAmounts: normalizeMoneyMap(remainingAmounts),
    }
  }
}

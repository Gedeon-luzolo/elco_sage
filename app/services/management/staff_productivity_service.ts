import { SalePaymentType } from '#models/sale'
import type Sale from '#models/sale'
import type SaleRecovery from '#models/sale_recovery'
import type { DashboardStaffProductivity, DashboardStaffProductivityRow } from '#types/dashboard'
import { getDashboardSaleRemainingDebt } from '#utils/dashboard_utils'
import { addMoneyAmount, emptyMoneyMap, normalizeMoneyMap, sumMoneyMaps } from '#utils/money_map'

interface StaffProductivitySource {
  sales: Sale[]
  recoveries: SaleRecovery[]
}

type StaffProductivityAccumulator = DashboardStaffProductivityRow

export default class StaffProductivityService {
  /**
   * Construit la productivité du personnel depuis les ventes et recouvrements déjà chargés.
   * Les ventes sont attribuées à l'opérateur de la vente, les recouvrements à l'agent qui a perçu.
   */
  buildReport({ sales, recoveries }: StaffProductivitySource): DashboardStaffProductivity {
    const rowsByUser = new Map<string, StaffProductivityAccumulator>()

    // Chaque vente augmente le compteur de l'opérateur et ses montants commerciaux.
    for (const sale of sales) {
      const row = this.getOrCreateRow(
        rowsByUser,
        sale.operatorId,
        sale.operator?.fullName ?? sale.operator?.email ?? 'Opérateur'
      )

      row.additionsCount += 1
      // Un bon est identifié par orderNumber; on évite de compter deux fois le même bon dans une vente.
      row.orderFormsCount += new Set((sale.items ?? []).map((item) => item.orderNumber)).size

      // Les offerts ne participent pas au réel, au cash, ni aux dettes.
      if (sale.paymentType === SalePaymentType.CASH) {
        addMoneyAmount(row.realAmounts, sale.currency, sale.totalAmount)
        addMoneyAmount(row.cashAmounts, sale.currency, sale.totalAmount)
      }

      if (sale.paymentType === SalePaymentType.CREDIT) {
        addMoneyAmount(row.realAmounts, sale.currency, sale.totalAmount)
        addMoneyAmount(row.remainingDebtAmounts, sale.currency, getDashboardSaleRemainingDebt(sale))
      }
    }

    // Un recouvrement est attribué à celui qui a réellement perçu le paiement.
    for (const recovery of recoveries) {
      const row = this.getOrCreateRow(
        rowsByUser,
        recovery.receivedById,
        recovery.receivedBy?.fullName ?? recovery.receivedBy?.email ?? 'Agent'
      )

      addMoneyAmount(row.recoveryAmounts, recovery.currency, recovery.amount)
    }

    const rows = [...rowsByUser.values()]
      .map((row) => ({
        ...row,
        collectionAmounts: normalizeMoneyMap(
          sumMoneyMaps(row.cashAmounts, row.recoveryAmounts)
        ) as Record<string, number>,
      }))
      .sort(
        (first, second) =>
          second.additionsCount - first.additionsCount ||
          first.staffName.localeCompare(second.staffName)
      )

    return {
      rows,
      totals: this.buildTotals(rows),
    }
  }

  /**
   * Retourne une ligne existante ou initialise un agent rencontré dans les ventes/recouvrements.
   */
  private getOrCreateRow(
    rows: Map<string, StaffProductivityAccumulator>,
    staffId: string,
    staffName: string
  ) {
    if (!rows.has(staffId)) {
      rows.set(staffId, {
        staffId,
        staffName,
        additionsCount: 0,
        orderFormsCount: 0,
        realAmounts: emptyMoneyMap(),
        cashAmounts: emptyMoneyMap(),
        recoveryAmounts: emptyMoneyMap(),
        collectionAmounts: emptyMoneyMap(),
        remainingDebtAmounts: emptyMoneyMap(),
      })
    }

    return rows.get(staffId)!
  }

  /**
   * Additionne les lignes du tableau pour produire le total affiché en bas du rapport.
   */
  private buildTotals(rows: DashboardStaffProductivityRow[]): DashboardStaffProductivityRow {
    const totals: DashboardStaffProductivityRow = {
      staffId: 'total',
      staffName: 'Total',
      additionsCount: 0,
      orderFormsCount: 0,
      realAmounts: emptyMoneyMap(),
      cashAmounts: emptyMoneyMap(),
      recoveryAmounts: emptyMoneyMap(),
      collectionAmounts: emptyMoneyMap(),
      remainingDebtAmounts: emptyMoneyMap(),
    }

    for (const row of rows) {
      totals.additionsCount += row.additionsCount
      totals.orderFormsCount += row.orderFormsCount

      // Les maps sont additionnées sans conversion entre devises.
      for (const [currency, amount] of Object.entries(row.realAmounts)) {
        addMoneyAmount(totals.realAmounts, currency, amount)
      }
      for (const [currency, amount] of Object.entries(row.cashAmounts)) {
        addMoneyAmount(totals.cashAmounts, currency, amount)
      }
      for (const [currency, amount] of Object.entries(row.recoveryAmounts)) {
        addMoneyAmount(totals.recoveryAmounts, currency, amount)
      }
      for (const [currency, amount] of Object.entries(row.collectionAmounts)) {
        addMoneyAmount(totals.collectionAmounts, currency, amount)
      }
      for (const [currency, amount] of Object.entries(row.remainingDebtAmounts)) {
        addMoneyAmount(totals.remainingDebtAmounts, currency, amount)
      }
    }

    return totals
  }
}

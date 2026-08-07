import Sale, { SalePaymentType, SaleStatus } from '#models/sale'
import type { Currency } from '#types/currency'
import type { FindDebtsParams, DebtSummary, DebtStats, DebtOverview } from '#types/debt'
import { DebtStatus } from '#types/debt'
import { normalizeDateRange } from '#utils/date_utils'
import { normalizeMoneyMap, type MoneyMap } from '#utils/money_map'
import { resolveDebtStatus } from '#utils/sale_debt.utils'

export default class DebtService {
  /**
   * Récupère les dettes et les petites statistiques affichées sur la page.
   */
  async getOverview(params: FindDebtsParams = {}): Promise<DebtOverview> {
    const debts = await this.findDebts(params)

    return {
      debts,
      stats: this.buildDebtStats(debts),
    }
  }

  /**
   * Récupère les ventes à crédit sur une période, puis calcule leur état de dette.
   * Le statut de dette n'est pas stocké: il dérive toujours des recouvrements existants.
   */
  async findDebts({ startDate, endDate, includePaid = false }: FindDebtsParams = {}) {
    const sales = await this.findCreditSales(startDate, endDate)
    const debts = sales.map((sale) => this.buildDebtSummary(sale))

    // Par défaut, la page de dettes se concentre sur ce qui reste à payer.
    if (!includePaid) {
      return debts.filter((debt) => debt.debtStatus !== DebtStatus.PAID)
    }

    return debts
  }

  /**
   * Calcule les montants de dette d'une vente chargée avec ses recouvrements.
   */
  buildDebtSummary(sale: Sale): DebtSummary {
    const recoveredAmount = this.getRecoveredAmount(sale)
    const debtTotalAmount = Number(sale.totalAmount || 0)
    const remainingAmount = Math.max(debtTotalAmount - recoveredAmount, 0)

    return {
      sale,
      debtTotalAmount,
      recoveredAmount,
      remainingAmount,
      debtStatus: resolveDebtStatus(debtTotalAmount, recoveredAmount),
    }
  }

  private async findCreditSales(startDate?: string, endDate?: string) {
    const query = Sale.query()
      .where('paymentType', SalePaymentType.CREDIT)
      .where('status', SaleStatus.ACTIVE)
      .preload('customer')
      .preload('operator')
      .preload('seller')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('productService')
      })
      .preload('recoveries', (recoveriesQuery) => {
        recoveriesQuery.preload('receivedBy').orderBy('recoveredAt', 'desc')
      })
      .orderBy('saleDate', 'desc')

    // La période couvre toujours les journées complètes pour inclure toutes les ventes du jour.
    if (startDate && endDate) {
      const dateRange = normalizeDateRange(startDate, endDate)

      query.whereBetween('saleDate', [dateRange.startDate, dateRange.endDate])
    }

    return query
  }

  private getRecoveredAmount(sale: Sale) {
    // Les recouvrements d'une dette doivent rester dans la devise de la vente.
    return (sale.recoveries ?? [])
      .filter((recovery) => recovery.currency === sale.currency)
      .reduce((total, recovery) => total + Number(recovery.amount || 0), 0)
  }

  private buildDebtStats(debts: DebtSummary[]): DebtStats {
    const totalDebtAmounts = this.sumDebtsByCurrency(debts, 'debtTotalAmount')
    const recoveredAmounts = this.sumDebtsByCurrency(debts, 'recoveredAmount')
    const remainingAmounts = this.sumDebtsByCurrency(debts, 'remainingAmount')

    return {
      totalDebts: debts.length,
      totalDebtAmounts: normalizeMoneyMap(totalDebtAmounts),
      recoveredAmounts: normalizeMoneyMap(recoveredAmounts),
      remainingAmounts: normalizeMoneyMap(remainingAmounts),
    }
  }

  private sumDebtsByCurrency(
    debts: DebtSummary[],
    amountKey: 'debtTotalAmount' | 'recoveredAmount' | 'remainingAmount'
  ) {
    return debts.reduce<MoneyMap>((amounts, debt) => {
      const currency = debt.sale.currency as Currency

      // Chaque montant reste dans sa devise d'origine: aucune conversion n'est appliquée.
      amounts[currency] = Number(amounts[currency] ?? 0) + Number(debt[amountKey] || 0)

      return amounts
    }, {})
  }
}

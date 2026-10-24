import CashSession from '#models/cash_session'
import Sale, { SalePaymentType, SaleStatus } from '#models/sale'
import SaleRecovery from '#models/sale_recovery'
import {
  normalizeMoneyMap,
  sumMoneyByCurrency,
  sumMoneyMaps,
  type MoneyMapDTO,
} from '#utils/money_map'

export interface SaleReportTotals {
  theoreticalAmounts: MoneyMapDTO
  discountAmounts: MoneyMapDTO
  cashAmounts: MoneyMapDTO
  debtAmounts: MoneyMapDTO
  realAmounts: MoneyMapDTO
  recoveryAmounts: MoneyMapDTO
  collectionAmounts: MoneyMapDTO
}

export interface SaleReport {
  session: CashSession
  sales: Sale[]
  totals: SaleReportTotals
}

export default class SaleReportService {
  /**
   * Charge le rapport d'une session visible par l'utilisateur courant.
   * Le resultat contient l'entete de session, les ventes actives et les totaux.
   */
  async getSessionReport(cashSessionId: string): Promise<SaleReport> {
    // La session est chargée avec ses utilisateurs pour l'entête du rapport.
    const session = await this.findSession(cashSessionId)

    // Les ventes portent les lignes et les recouvrements du rapport.
    const sales = await this.findSessionSales(session.id)

    // Les recouvrements sont ceux encaissés pendant la session, comme à la clôture,
    // même si la dette vient d'une vente d'une autre session.
    const recoveries = await SaleRecovery.query().where('cashSessionId', session.id)

    return {
      session,
      sales,
      totals: this.buildReportTotals(sales, recoveries),
    }
  }

  /**
   * Retrouve une session de caisse avec son ouvreur et celui qui l'a fermée.
   * La caisse est partagee : tous les utilisateurs peuvent lire les sessions.
   */
  private async findSession(cashSessionId: string) {
    return CashSession.query()
      .where('id', cashSessionId)
      .preload('openedBy')
      .preload('closedBy')
      .firstOrFail()
  }

  /**
   * Charge les ventes actives rattachees a une session.
   * Les relations utiles au tableau sont prechargees en une seule lecture.
   */
  private async findSessionSales(cashSessionId: string) {
    return (
      Sale.query()
        // Le rapport ne doit afficher que les ventes valides de la session demandee.
        .where('cashSessionId', cashSessionId)
        .where('status', SaleStatus.ACTIVE)
        // Les relations simples alimentent les colonnes client, operateur et vendeur.
        .preload('customer')
        .preload('operator')
        .preload('seller')
        // Chaque ligne de vente garde son service pour le detail du tableau.
        .preload('items', (itemsQuery) => {
          itemsQuery.preload('productService')
        })
        // Les recouvrements restent disponibles pour les totaux et le detail financier.
        .preload('recoveries', (recoveriesQuery) => {
          recoveriesQuery.preload('receivedBy').orderBy('recoveredAt', 'desc')
        })
        .orderBy('saleDate', 'asc')
    )
  }

  /**
   * Calcule les totaux financiers du rapport de session.
   * Les montants restent sous forme de MoneyMap pour laisser le formatage au frontend.
   */
  private buildReportTotals(sales: Sale[], recoveries: SaleRecovery[]): SaleReportTotals {
    // Les ventes cash et les dettes ne participent pas aux memes indicateurs.
    const cashSales = sales.filter((sale) => sale.paymentType === SalePaymentType.CASH)
    const debtSales = sales.filter((sale) => sale.paymentType === SalePaymentType.CREDIT)

    // Les montants sont regroupes par devise; le frontend se charge du formatage.
    const theoreticalAmounts = sumMoneyByCurrency(
      sales,
      (sale) => sale.currency,
      (sale) => sale.theoreticalAmount
    )
    const discountAmounts = sumMoneyByCurrency(
      sales,
      (sale) => sale.currency,
      (sale) => sale.discountAmount
    )
    const cashAmounts = sumMoneyByCurrency(
      cashSales,
      (sale) => sale.currency,
      (sale) => sale.totalAmount
    )
    const debtAmounts = sumMoneyByCurrency(
      debtSales,
      (sale) => sale.currency,
      (sale) => sale.totalAmount
    )
    const recoveryAmounts = sumMoneyByCurrency(
      recoveries,
      (recovery) => recovery.currency,
      (recovery) => recovery.amount
    )

    // Le reel represente les ventes de la session, cash et credit confondus.
    const realAmounts = sumMoneyMaps(cashAmounts, debtAmounts)

    // L'encaissement correspond a l'argent entre en caisse: cash + recouvrements.
    const collectionAmounts = sumMoneyMaps(cashAmounts, recoveryAmounts)

    // Les maps sont normalisees pour toujours exposer une valeur par devise connue.
    return {
      theoreticalAmounts: normalizeMoneyMap(theoreticalAmounts),
      discountAmounts: normalizeMoneyMap(discountAmounts),
      cashAmounts: normalizeMoneyMap(cashAmounts),
      debtAmounts: normalizeMoneyMap(debtAmounts),
      realAmounts: normalizeMoneyMap(realAmounts),
      recoveryAmounts: normalizeMoneyMap(recoveryAmounts),
      collectionAmounts: normalizeMoneyMap(collectionAmounts),
    }
  }
}

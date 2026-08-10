import { SalePaymentType } from '#models/sale'
import type Sale from '#models/sale'
import type SaleRecovery from '#models/sale_recovery'
import type { DashboardPeriodicReport } from '#types/dashboard'
import { getDashboardSaleRemainingDebt } from '#utils/dashboard_utils'
import { dateKeyToDay, dateTimeToDateKey } from '#utils/date_utils'
import {
  addMoneyAmount,
  emptyMoneyMap,
  normalizeMoneyMap,
  sumMoneyMaps,
  type MoneyMapDTO,
} from '#utils/money_map'
import { DateTime } from 'luxon'

interface PeriodicReportSource {
  sales: Sale[]
  recoveries: SaleRecovery[]
  startDate: Date
  endDate: Date
}

export default class PeriodicReportService {
  /**
   * Normalise les ventes déjà chargées par le parent en lignes journalières.
   * Ce service ne lit pas la base de données: il transforme seulement les données reçues.
   */
  buildSalesReport(source: PeriodicReportSource): DashboardPeriodicReport[] {
    // Prépare une ligne vide pour chaque jour, même si aucune vente n'existe ce jour-là.
    const reportsByDate = this.buildEmptyReports(source.startDate, source.endDate)

    // Les ventes alimentent les montants commerciaux et les compteurs de bons/additions/services.
    for (const sale of source.sales) {
      this.applySale(reportsByDate.get(dateTimeToDateKey(sale.saleDate))!, sale)
    }

    // Les recouvrements sont rattachés au jour du paiement, pas au jour de la vente initiale.
    for (const recovery of source.recoveries) {
      this.applyRecovery(reportsByDate.get(dateTimeToDateKey(recovery.recoveredAt))!, recovery)
    }

    // Le total encaissements dépend du cash et des recouvrements déjà regroupés par jour.
    return [...reportsByDate.values()].map((report) => ({
      ...report,
      collectionAmounts: normalizeMoneyMap(
        sumMoneyMaps(report.cashAmounts, report.recoveryAmounts)
      ) as MoneyMapDTO,
    }))
  }

  /**
   * Crée une map indexée par date avec des montants et compteurs initialisés à zéro.
   * Cela garantit un rapport continu, sans trou entre la date de début et la date de fin.
   */
  private buildEmptyReports(startDate: Date, endDate: Date) {
    const reports = new Map<string, DashboardPeriodicReport>()
    let cursor = dateKeyToDay(dateTimeToDateKey(DateTime.fromJSDate(startDate)))
    const end = dateKeyToDay(dateTimeToDateKey(DateTime.fromJSDate(endDate)))

    // On avance jour par jour pour conserver l'ordre chronologique naturel du rapport.
    while (cursor <= end) {
      const date = cursor.toISODate()!

      reports.set(date, {
        date,
        label: cursor.toFormat('dd/MM/yyyy'),
        theoreticalAmounts: emptyMoneyMap(),
        offeredAmounts: emptyMoneyMap(),
        discountAmounts: emptyMoneyMap(),
        realAmounts: emptyMoneyMap(),
        remainingDebtAmounts: emptyMoneyMap(),
        cashAmounts: emptyMoneyMap(),
        recoveryAmounts: emptyMoneyMap(),
        collectionAmounts: emptyMoneyMap(),
        orderFormsCount: 0,
        additionsCount: 0,
        soldServicesCount: 0,
      })

      cursor = cursor.plus({ days: 1 })
    }

    return reports
  }

  /**
   * Ajoute une vente au rapport du jour correspondant.
   * Les montants financiers sont ajoutés par devise, sans conversion entre CDF et USD.
   */
  private applySale(report: DashboardPeriodicReport, sale: Sale) {
    // Le théorique garde le brut de toutes les ventes actives, y compris les offerts.
    addMoneyAmount(report.theoreticalAmounts, sale.currency, sale.theoreticalAmount)

    // Une addition correspond à une vente enregistrée.
    report.additionsCount += 1
    // Les bons sont comptés distinctement pour éviter de compter deux fois le même orderNumber.
    report.orderFormsCount += new Set((sale.items ?? []).map((item) => item.orderNumber)).size
    // Les services vendus représentent la somme des quantités sur les lignes de vente.
    report.soldServicesCount += (sale.items ?? []).reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    )

    // Le cash entre directement dans les encaissements du jour de la vente.
    if (sale.paymentType === SalePaymentType.CASH) {
      addMoneyAmount(report.discountAmounts, sale.currency, sale.discountAmount)
      addMoneyAmount(report.realAmounts, sale.currency, sale.totalAmount)
      addMoneyAmount(report.cashAmounts, sale.currency, sale.totalAmount)
    }

    // La dette restante est calculée à partir des recouvrements déjà préchargés sur la vente.
    if (sale.paymentType === SalePaymentType.CREDIT) {
      addMoneyAmount(report.discountAmounts, sale.currency, sale.discountAmount)
      addMoneyAmount(report.realAmounts, sale.currency, sale.totalAmount)
      addMoneyAmount(
        report.remainingDebtAmounts,
        sale.currency,
        getDashboardSaleRemainingDebt(sale)
      )
    }

    // Les offerts sont isolés avant remise et ne doivent pas augmenter le chiffre d'affaires réel.
    if (sale.paymentType === SalePaymentType.OFFERED) {
      addMoneyAmount(report.offeredAmounts, sale.currency, sale.theoreticalAmount)
    }
  }

  /**
   * Ajoute un recouvrement au jour où le paiement a été reçu.
   * Le recouvrement reste dans sa devise d'origine.
   */
  private applyRecovery(report: DashboardPeriodicReport, recovery: SaleRecovery) {
    addMoneyAmount(report.recoveryAmounts, recovery.currency, recovery.amount)
  }
}

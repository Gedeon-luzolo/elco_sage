import Sale, { SaleStatus } from '#models/sale'
import SaleRecovery from '#models/sale_recovery'
import DashboardStatsService from '#services/management/dashboard_stats_service'
import PeriodicReportService from '#services/management/periodic_report_service'
import StaffProductivityService from '#services/management/staff_productivity_service'
import type { DashboardOverview, DashboardPeriod } from '#types/dashboard'
import { Currency } from '#types/currency'
import { dateKeyToDay, normalizeDateRange, todayDateKey } from '#utils/date_utils'
import { inject } from '@adonisjs/core'

export interface DashboardFilters {
  startDate?: string | null
  endDate?: string | null
}

@inject()
export default class DashboardService {
  constructor(
    private periodicReportService: PeriodicReportService,
    private dashboardStatsService: DashboardStatsService,
    private staffProductivityService: StaffProductivityService
  ) {}

  /**
   * Construit les données du dashboard management pour une période complète.
   * Les montants restent séparés par devise afin d'éviter les conversions implicites.
   * Ce service reste le parent: il charge les données brutes une seule fois puis délègue les calculs.
   */
  async getOverview(filters: DashboardFilters = {}): Promise<DashboardOverview> {
    // Les filtres URL sont transformés en période métier lisible par le frontend.
    const period = this.resolvePeriod(filters)
    // La plage SQL couvre les journées complètes dans le fuseau métier.
    const range = normalizeDateRange(period.startDate, period.endDate)

    // Les données brutes communes sont chargées une seule fois pour éviter les agrégats SQL répétés.
    const [reportSales, reportRecoveries] = await Promise.all([
      this.getReportSales(range.startDate, range.endDate),
      this.getReportRecoveries(range.startDate, range.endDate),
    ])

    // Les cards principales sont calculées en mémoire depuis les mêmes ventes/recouvrements.
    const stats = this.dashboardStatsService.buildStats({
      sales: reportSales,
      recoveries: reportRecoveries,
    })

    // Le rapport journalier réutilise les données chargées par le parent.
    const periodicReports = this.periodicReportService.buildSalesReport({
      sales: reportSales,
      recoveries: reportRecoveries,
      startDate: range.startDate,
      endDate: range.endDate,
    })

    // Le graphique d'évolution est dérivé du rapport journalier pour garder les mêmes dates.
    const dailySales = periodicReports.map((report) => ({
      date: report.date,
      label: dateKeyToDay(report.date).toFormat('dd/MM'),
      cdf: report.realAmounts[Currency.CDF],
      usd: report.realAmounts[Currency.USD],
      count: report.additionsCount,
    }))

    // Les graphiques annexes restent aussi basés sur les ventes déjà préchargées.
    const paymentDistribution = this.dashboardStatsService.buildPaymentDistribution(reportSales)
    const topServices = this.dashboardStatsService.buildTopServices(reportSales, 15)
    const staffProductivity = this.staffProductivityService.buildReport({
      sales: reportSales,
      recoveries: reportRecoveries,
    })

    return {
      period,
      stats,
      periodicReports,
      dailySales,
      paymentDistribution,
      topServices,
      staffProductivity,
    }
  }

  /**
   * Détermine la période effective du dashboard.
   * Sans filtres, on affiche le mois courant jusqu'a aujourd'hui.
   */
  private resolvePeriod(filters: DashboardFilters): DashboardPeriod {
    const today = todayDateKey()
    // Le début par défaut suit le mois métier courant.
    const startDate = filters.startDate ?? dateKeyToDay(today).startOf('month').toISODate()!

    return {
      startDate,
      endDate: filters.endDate ?? today,
    }
  }

  /**
   * Charge les ventes brutes nécessaires aux stats, rapports et graphiques.
   * Les relations items/productService et recoveries sont préchargées pour les calculs en mémoire.
   */
  private async getReportSales(startDate: Date, endDate: Date) {
    return (
      Sale.query()
        // Le dashboard financier ignore les ventes annulées.
        .where('status', SaleStatus.ACTIVE)
        // La période a déjà été normalisée par normalizeDateRange.
        .whereBetween('saleDate', [startDate, endDate])
        .preload('items', (itemsQuery) => {
          // Le nom du service est nécessaire pour le classement des services vendus.
          itemsQuery.preload('productService')
        })
        // Les recouvrements préchargés servent au calcul du reste à payer.
        .preload('operator')
        .preload('recoveries')
    )
  }

  /**
   * Charge les paiements reçus sur la période pour calculer les recouvrements.
   * La date de recouvrement est indépendante de la date de vente.
   */
  private async getReportRecoveries(startDate: Date, endDate: Date) {
    return SaleRecovery.query()
      .whereBetween('recoveredAt', [startDate, endDate])
      .preload('receivedBy')
  }
}

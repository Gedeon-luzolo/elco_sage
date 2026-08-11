import StockMovement from '#models/stock_movement'
import type { DashboardStockReport, DashboardStockReportRow } from '#types/dashboard'
import { dateTimeToDateKey } from '#utils/date_utils'
import { DateTime } from 'luxon'

interface StockReportSource {
  startDate: Date
  endDate: Date
}

interface StockReportAccumulator {
  productId: string
  productName: string
  categoryName: string | null
  baseUnit: string | null
  materialCostCdf: number
  periodInitialStock: number
  totalEntries: number
  periodStock: number
  totalOutputs: number
  totalLosses: number
  finalTheoreticalStock: number
  lastPhysicalStock: number | null
  finalVariance: number | null
}

export default class StockReportService {
  /**
   * Construit le rapport de stock pour la période demandée.
   */
  async buildReport(source: StockReportSource): Promise<DashboardStockReport> {
    const movements = await this.getPeriodMovements(source.startDate, source.endDate)
    const rows = this.buildRows(movements)

    return {
      rows,
      totals: this.buildTotals(rows),
    }
  }

  /**
   * Charge les mouvements de stock de la période avec leurs produits.
   */
  private async getPeriodMovements(startDate: Date, endDate: Date) {
    // Les colonnes date du stock sont journalières, donc on filtre avec les clés YYYY-MM-DD.
    const startDateKey = dateTimeToDateKey(DateTime.fromJSDate(startDate))
    const endDateKey = dateTimeToDateKey(DateTime.fromJSDate(endDate))

    return StockMovement.query()
      .whereBetween('date', [startDateKey, endDateKey])
      .preload('product', (productQuery) => {
        productQuery
          .select('id', 'name', 'baseUnit', 'categoryId', 'materialCostCdf')
          .preload('category', (categoryQuery) => categoryQuery.select('id', 'name'))
      })
      .orderBy('date', 'asc')
  }

  /**
   * Regroupe les mouvements par produit.
   */
  private buildRows(movements: StockMovement[]): DashboardStockReportRow[] {
    const reportByProduct = new Map<string, StockReportAccumulator>()

    for (const movement of movements) {
      // Chaque produit a une seule ligne de rapport, alimentée par tous ses mouvements.
      const report = this.getOrCreateReport(reportByProduct, movement)

      // Les totaux de flux sont cumulés sur toute la période demandée.
      report.totalEntries += Number(movement.entries || 0)
      report.totalOutputs += Number(movement.outputs || 0)
      report.totalLosses += Number(movement.losses || 0)

      // Le dernier mouvement chronologique porte le théorique final de la période.
      report.finalTheoreticalStock = movement.theoreticalStock

      if (movement.isPhysicalStockValidated) {
        report.lastPhysicalStock = movement.physicalStock
        report.finalVariance = movement.variance
      }
    }

    return [...reportByProduct.values()]
      .map((report) => {
        // Le stock de période représente le stock disponible avant sorties et pertes.
        const periodStock = report.periodInitialStock + report.totalEntries

        return {
          productId: report.productId,
          productName: report.productName,
          categoryName: report.categoryName,
          baseUnit: report.baseUnit,
          periodInitialStock: report.periodInitialStock,
          totalEntries: report.totalEntries,
          periodStock,
          periodStockValueCdf: periodStock * report.materialCostCdf,
          totalOutputs: report.totalOutputs,
          outputsValueCdf: report.totalOutputs * report.materialCostCdf,
          totalLosses: report.totalLosses,
          lossesValueCdf: report.totalLosses * report.materialCostCdf,
          finalTheoreticalStock: report.finalTheoreticalStock,
          lastPhysicalStock: report.lastPhysicalStock,
          physicalStockValueCdf:
            report.lastPhysicalStock === null
              ? null
              : report.lastPhysicalStock * report.materialCostCdf,
          finalVariance: report.finalVariance,
        }
      })
      .sort((first, second) => first.productName.localeCompare(second.productName))
  }

  /**
   * Crée la ligne produit au premier mouvement rencontré.
   */
  private getOrCreateReport(
    reportByProduct: Map<string, StockReportAccumulator>,
    movement: StockMovement
  ) {
    const existing = reportByProduct.get(movement.productId)

    // Si le produit a déjà une ligne de rapport, on la réutilise.
    if (existing) {
      return existing
    }

    // Le premier mouvement chronologique fixe le stock initial de la période.
    const report: StockReportAccumulator = {
      productId: movement.productId,
      productName: movement.product?.name ?? 'Produit',
      categoryName: movement.product?.category?.name ?? null,
      baseUnit: movement.product?.baseUnit ?? null,
      materialCostCdf: Number(movement.product?.materialCostCdf || 0),
      periodInitialStock: Number(movement.initialStock || 0),
      totalEntries: 0,
      periodStock: Number(movement.initialStock || 0),
      totalOutputs: 0,
      totalLosses: 0,
      finalTheoreticalStock: Number(movement.theoreticalStock || 0),
      lastPhysicalStock: null,
      finalVariance: null,
    }

    // La ligne est mémorisée pour recevoir les prochains mouvements du même produit.
    reportByProduct.set(movement.productId, report)
    return report
  }

  /**
   * Calcule la ligne total du rapport.
   */
  private buildTotals(rows: DashboardStockReportRow[]): DashboardStockReportRow {
    // Le total physique n'est affichable que si toutes les lignes ont un stock physique.
    const allRowsHavePhysicalStock = rows.every((row) => row.lastPhysicalStock !== null)
    // Le total des écarts n'est affichable que si toutes les lignes ont un écart calculé.
    const allRowsHaveVariance = rows.every((row) => row.finalVariance !== null)

    // Les unités peuvent varier par produit; les totaux numériques restent indicatifs.
    const totals = rows.reduce<DashboardStockReportRow>(
      (totals, row) => ({
        ...totals,
        periodInitialStock: totals.periodInitialStock + row.periodInitialStock,
        totalEntries: totals.totalEntries + row.totalEntries,
        periodStock: totals.periodStock + row.periodStock,
        periodStockValueCdf: totals.periodStockValueCdf + row.periodStockValueCdf,
        totalOutputs: totals.totalOutputs + row.totalOutputs,
        outputsValueCdf: totals.outputsValueCdf + row.outputsValueCdf,
        totalLosses: totals.totalLosses + row.totalLosses,
        lossesValueCdf: totals.lossesValueCdf + row.lossesValueCdf,
        finalTheoreticalStock: totals.finalTheoreticalStock + row.finalTheoreticalStock,
        lastPhysicalStock: totals.lastPhysicalStock! + Number(row.lastPhysicalStock || 0),
        physicalStockValueCdf:
          totals.physicalStockValueCdf! + Number(row.physicalStockValueCdf || 0),
        finalVariance: totals.finalVariance! + Number(row.finalVariance || 0),
      }),
      {
        productId: 'total',
        productName: 'Total',
        categoryName: null,
        baseUnit: null,
        periodInitialStock: 0,
        totalEntries: 0,
        periodStock: 0,
        periodStockValueCdf: 0,
        totalOutputs: 0,
        outputsValueCdf: 0,
        totalLosses: 0,
        lossesValueCdf: 0,
        finalTheoreticalStock: 0,
        lastPhysicalStock: rows.length === 0 ? 0 : null,
        physicalStockValueCdf: rows.length === 0 ? 0 : null,
        finalVariance: rows.length === 0 ? 0 : null,
      }
    )

    // On masque les totaux partiels pour éviter de présenter un stock physique incomplet.
    return {
      ...totals,
      lastPhysicalStock:
        rows.length === 0 || allRowsHavePhysicalStock ? totals.lastPhysicalStock : null,
      physicalStockValueCdf:
        rows.length === 0 || allRowsHavePhysicalStock ? totals.physicalStockValueCdf : null,
      finalVariance: rows.length === 0 || allRowsHaveVariance ? totals.finalVariance : null,
    }
  }
}

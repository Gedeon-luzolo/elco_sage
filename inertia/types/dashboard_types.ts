import type { JSONDataTypes } from '@adonisjs/core/types/transformers'
import type { MoneyMap } from '~/types/cash_session_types'

// Type frontend pour la période appliquée au dashboard.
export interface DashboardPeriod extends Record<string, JSONDataTypes> {
  startDate: string
  endDate: string
}

// Type frontend pour les cartes statistiques principales du dashboard.
export interface DashboardStats extends Record<string, JSONDataTypes> {
  salesCount: number
  cashSalesCount: number
  creditSalesCount: number
  offeredSalesCount: number
  theoreticalAmounts: MoneyMap
  offeredAmounts: MoneyMap
  realAmounts: MoneyMap
  cashAmounts: MoneyMap
  creditAmounts: MoneyMap
  discountAmounts: MoneyMap
  recoveryAmounts: MoneyMap
  remainingDebtAmounts: MoneyMap
  collectionAmounts: MoneyMap
}

// Type frontend pour les points du graphique d'évolution journalière des ventes.
export interface DashboardDailySale extends Record<string, JSONDataTypes> {
  date: string
  label: string
  cdf: number
  usd: number
  count: number
}

// Type frontend pour la répartition des ventes par mode de paiement.
export interface DashboardPaymentDistribution extends Record<string, JSONDataTypes> {
  paymentType: string
  count: number
  amountCdf: number
  amountUsd: number
}

// Type frontend pour le classement des services les plus vendus.
export interface DashboardTopService extends Record<string, JSONDataTypes> {
  id: string
  name: string
  quantity: number
  amountCdf: number
  amountUsd: number
}

// Type frontend pour une ligne de productivité du personnel.
export interface DashboardStaffProductivityRow extends Record<string, JSONDataTypes> {
  staffId: string
  staffName: string
  additionsCount: number
  orderFormsCount: number
  realAmounts: MoneyMap
  cashAmounts: MoneyMap
  recoveryAmounts: MoneyMap
  collectionAmounts: MoneyMap
  remainingDebtAmounts: MoneyMap
}

// Type frontend pour les données de productivité du personnel avec la ligne total.
export interface DashboardStaffProductivity extends Record<string, JSONDataTypes> {
  rows: DashboardStaffProductivityRow[]
  totals: DashboardStaffProductivityRow
}

// Type frontend pour une ligne du rapport de stock par produit sur une période.
export interface DashboardStockReportRow extends Record<string, JSONDataTypes> {
  productId: string
  productName: string
  categoryName: string | null
  baseUnit: string | null
  periodInitialStock: number
  totalEntries: number
  periodStock: number
  periodStockValueCdf: number
  totalOutputs: number
  outputsValueCdf: number
  totalLosses: number
  lossesValueCdf: number
  finalTheoreticalStock: number
  lastPhysicalStock: number | null
  physicalStockValueCdf: number | null
  finalVariance: number | null
}

// Type frontend pour les données de stock avec la ligne total.
export interface DashboardStockReport extends Record<string, JSONDataTypes> {
  rows: DashboardStockReportRow[]
  totals: DashboardStockReportRow
}

// Type frontend pour une ligne du rapport périodique des ventes.
export interface DashboardPeriodicReport extends Record<string, JSONDataTypes> {
  date: string
  label: string
  theoreticalAmounts: MoneyMap
  offeredAmounts: MoneyMap
  discountAmounts: MoneyMap
  realAmounts: MoneyMap
  remainingDebtAmounts: MoneyMap
  cashAmounts: MoneyMap
  recoveryAmounts: MoneyMap
  collectionAmounts: MoneyMap
  orderFormsCount: number
  additionsCount: number
  soldServicesCount: number
}

// Type frontend pour les props complètes de la page dashboard management.
export interface ManagementDashboardPageProps extends Record<string, JSONDataTypes> {
  period: DashboardPeriod
  stats: DashboardStats
  periodicReports: DashboardPeriodicReport[]
  dailySales: DashboardDailySale[]
  paymentDistribution: DashboardPaymentDistribution[]
  topServices: DashboardTopService[]
  staffProductivity: DashboardStaffProductivity
  stockReport: DashboardStockReport
}

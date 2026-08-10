import type { MoneyMapDTO } from '#utils/money_map'

// Type pour la période appliquée au dashboard.
export interface DashboardPeriod {
  startDate: string
  endDate: string
}

// Type pour les cartes statistiques principales du dashboard.
export interface DashboardStats {
  salesCount: number
  cashSalesCount: number
  creditSalesCount: number
  offeredSalesCount: number
  theoreticalAmounts: MoneyMapDTO
  offeredAmounts: MoneyMapDTO
  realAmounts: MoneyMapDTO
  cashAmounts: MoneyMapDTO
  creditAmounts: MoneyMapDTO
  discountAmounts: MoneyMapDTO
  recoveryAmounts: MoneyMapDTO
  remainingDebtAmounts: MoneyMapDTO
  collectionAmounts: MoneyMapDTO
}

// Type pour les points du graphique d'évolution journalière des ventes.
export interface DashboardDailySale {
  date: string
  label: string
  cdf: number
  usd: number
  count: number
}

// Type pour la répartition des ventes par mode de paiement.
export interface DashboardPaymentDistribution {
  paymentType: string
  count: number
  amountCdf: number
  amountUsd: number
}

// Type pour le classement des services les plus vendus.
export interface DashboardTopService {
  id: string
  name: string
  quantity: number
  amountCdf: number
  amountUsd: number
}

// Type pour une ligne de productivité du personnel.
export interface DashboardStaffProductivityRow {
  staffId: string
  staffName: string
  additionsCount: number
  orderFormsCount: number
  realAmounts: MoneyMapDTO
  cashAmounts: MoneyMapDTO
  recoveryAmounts: MoneyMapDTO
  collectionAmounts: MoneyMapDTO
  remainingDebtAmounts: MoneyMapDTO
}

// Type pour les données de productivité du personnel avec la ligne total.
export interface DashboardStaffProductivity {
  rows: DashboardStaffProductivityRow[]
  totals: DashboardStaffProductivityRow
}

// Type pour une ligne du rapport périodique des ventes.
export interface DashboardPeriodicReport {
  date: string
  label: string
  theoreticalAmounts: MoneyMapDTO
  offeredAmounts: MoneyMapDTO
  discountAmounts: MoneyMapDTO
  realAmounts: MoneyMapDTO
  remainingDebtAmounts: MoneyMapDTO
  cashAmounts: MoneyMapDTO
  recoveryAmounts: MoneyMapDTO
  collectionAmounts: MoneyMapDTO
  orderFormsCount: number
  additionsCount: number
  soldServicesCount: number
}

// Type pour toutes les données renvoyées par le dashboard management.
export interface DashboardOverview {
  period: DashboardPeriod
  stats: DashboardStats
  periodicReports: DashboardPeriodicReport[]
  dailySales: DashboardDailySale[]
  paymentDistribution: DashboardPaymentDistribution[]
  topServices: DashboardTopService[]
  staffProductivity: DashboardStaffProductivity
}

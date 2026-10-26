import type { MoneyMap } from '~/types/cash_session_types'

// Type frontend pour la période appliquée au dashboard.
export interface DashboardPeriod {
  startDate: string
  endDate: string
}

// Type frontend pour les cartes statistiques principales du dashboard.
export interface DashboardStats {
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
interface DashboardDailySale {
  date: string
  label: string
  cdf: number
  usd: number
  count: number
}

// Type frontend pour la répartition des ventes par mode de paiement.
interface DashboardPaymentDistribution {
  paymentType: string
  count: number
  amountCdf: number
  amountUsd: number
}

// Type frontend pour le classement des services les plus vendus.
export interface DashboardTopService {
  id: string
  name: string
  quantity: number
  amountCdf: number
  amountUsd: number
}

// Type frontend pour une ligne de productivité du personnel.
export interface DashboardStaffProductivityRow {
  staffId: string
  staffName: string
  additionsCount: number
  realAmounts: MoneyMap
  cashAmounts: MoneyMap
  recoveryAmounts: MoneyMap
  collectionAmounts: MoneyMap
  remainingDebtAmounts: MoneyMap
}

// Type frontend pour les données de productivité du personnel avec la ligne total.
export interface DashboardStaffProductivity {
  rows: DashboardStaffProductivityRow[]
  totals: DashboardStaffProductivityRow
}

// Type frontend pour une ligne du rapport périodique des ventes.
export interface DashboardPeriodicReport {
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
  additionsCount: number
  soldServicesCount: number
}

// Type frontend pour les props complètes de la page dashboard management.
export interface ManagementDashboardPageProps {
  period: DashboardPeriod
  stats: DashboardStats
  periodicReports: DashboardPeriodicReport[]
  dailySales: DashboardDailySale[]
  paymentDistribution: DashboardPaymentDistribution[]
  topServices: DashboardTopService[]
  staffProductivity: DashboardStaffProductivity
}

import { router } from '@inertiajs/react'
import {
  Activity,
  Banknote,
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Gift,
  HandCoins,
  Package,
  ReceiptText,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { StatCard } from '~/components/common/stat_card'
import { DashboardChartsTab } from '~/components/management/dashboard/dashboard_charts_tab'
import { DashboardPeriodicReportTab } from '~/components/management/dashboard/dashboard_periodic_report_tab'
import { DashboardStaffProductivityTab } from '~/components/management/dashboard/dashboard_staff_productivity_tab'
import { DashboardStockReportTab } from '~/components/management/dashboard/dashboard_stock_report_tab'
import { PeriodSelector } from '~/components/ui/period_selector'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useSelectionDate } from '~/hooks/use_selection_date'
import { ManagementLayout } from '~/layouts/management_layout'
import type { InertiaProps } from '~/types'
import type { ManagementDashboardPageProps } from '~/types/dashboard_types'
import { renderMoneyMap } from '~/utils/money_map.utils'

export default function ManagementPage({
  period,
  stats,
  periodicReports,
  topServices,
  staffProductivity,
}: InertiaProps<ManagementDashboardPageProps>) {
  const selectionDate = useSelectionDate({
    initialStartDate: period.startDate,
    initialEndDate: period.endDate,
  })
  const [isLoading, setIsLoading] = useState(false)

  // Recharge le dashboard avec la période sélectionnée.
  const searchDashboard = () => {
    setIsLoading(true)
    router.get(
      '/management',
      { startDate: selectionDate.startDate, endDate: selectionDate.endDate },
      {
        preserveState: false,
        preserveScroll: true,
        onFinish: () => setIsLoading(false),
      }
    )
  }

  const mainStats = [
    {
      label: "Chiffre d'affaires théorique",
      value: renderMoneyMap(stats.theoreticalAmounts),
      color: 'indigo' as const,
      icon: CircleDollarSign,
    },
    {
      label: 'Offerts',
      value: renderMoneyMap(stats.offeredAmounts),
      color: 'neutral' as const,
      icon: Gift,
    },
    {
      label: 'Remise',
      value: renderMoneyMap(stats.discountAmounts),
      color: 'amber' as const,
      icon: ReceiptText,
    },
    {
      label: "Chiffre d'affaires réel",
      value: renderMoneyMap(stats.realAmounts),
      color: 'blue' as const,
      icon: CircleDollarSign,
    },
    {
      label: 'Dettes',
      value: renderMoneyMap(stats.remainingDebtAmounts),
      color: 'rose' as const,
      icon: CreditCard,
    },
    {
      label: 'Cash',
      value: renderMoneyMap(stats.cashAmounts),
      color: 'emerald' as const,
      icon: Banknote,
    },
    {
      label: 'Recouvrement',
      value: renderMoneyMap(stats.recoveryAmounts),
      color: 'teal' as const,
      icon: HandCoins,
    },
    {
      label: 'Total encaissements',
      value: renderMoneyMap(stats.collectionAmounts),
      color: 'green' as const,
      icon: Wallet,
    },
  ]

  return (
    <ManagementLayout title="Management">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Activity className="size-4" />
              Dashboard
            </div>
            <h2 className="text-2xl font-semibold tracking-normal">Vue générale</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Synthèse financière des ventes, remises, crédits et encaissements.
            </p>
          </div>

          <PeriodSelector
            startDate={selectionDate.startDate}
            endDate={selectionDate.endDate}
            onDateChange={selectionDate.handleDateChange}
            onSearch={searchDashboard}
            isLoading={isLoading}
            className="w-full lg:w-auto"
            hideCardWrapper
          />
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {mainStats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              color={stat.color}
              icon={stat.icon}
            />
          ))}
        </section>

        <Tabs defaultValue="sales-report" className="gap-4">
          <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <TabsTrigger value="sales-report">
              <ClipboardList className="size-4" />
              Rapport des ventes
            </TabsTrigger>
            <TabsTrigger value="stock-report">
              <Package className="size-4" />
              Rapport de stock
            </TabsTrigger>
            <TabsTrigger value="staff-productivity">
              <TrendingUp className="size-4" />
              Productivité du personnel
            </TabsTrigger>
            <TabsTrigger value="charts">
              <BarChart3 className="size-4" />
              Diagrammes & graphiques
            </TabsTrigger>
          </TabsList>

          <DashboardPeriodicReportTab periodicReports={periodicReports} />
          <DashboardStockReportTab />
          <DashboardStaffProductivityTab staffProductivity={staffProductivity} />
          <DashboardChartsTab stats={stats} topServices={topServices} />
        </Tabs>
      </section>
    </ManagementLayout>
  )
}

import { ClipboardList, Printer } from 'lucide-react'
import { EmptyState } from '~/components/common/empty_state'
import { PrintReportHeader } from '~/components/common/print_report_header'
import { DashboardPrintStatsSection } from '~/components/management/dashboard/dashboard_print_stats_section'
import { DashboardPeriodicReportTable } from '~/components/management/dashboard/dashboard_periodic_report_table'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { TabsContent } from '~/components/ui/tabs'
import { usePaginated } from '~/hooks/use_paginated'
import { useSimplePrint } from '~/hooks/use_simple_print'
import type { DashboardPeriod, DashboardPeriodicReport, DashboardStats } from '~/types/dashboard_types'
import { formatDateLabel } from '~/utils/date'
import { renderMoneyMap } from '~/utils/money_map.utils'

const PERIODIC_REPORT_PAGE_SIZE = 10

interface DashboardPeriodicReportTabProps {
  period: DashboardPeriod
  stats: DashboardStats
  periodicReports: DashboardPeriodicReport[]
}

/**
 * Affiche le rapport périodique des ventes du dashboard.
 */
export function DashboardPeriodicReportTab({
  period,
  stats,
  periodicReports,
}: DashboardPeriodicReportTabProps) {
  // L'écran est paginé, l'impression reprend toutes les lignes chargées de la période.
  const paginatedReports = usePaginated<DashboardPeriodicReport>({
    initialItems: periodicReports,
    pageSize: PERIODIC_REPORT_PAGE_SIZE,
  })
  const { PrintContainer, handlePrint } = useSimplePrint()

  return (
    <TabsContent value="sales-report">
      <PrintContainer>
        <PrintReportHeader
          title="Rapport mensuel des ventes"
          description={`Période du ${formatDateLabel(period.startDate)} au ${formatDateLabel(
            period.endDate
          )}`}
        />
        <DashboardPrintStatsSection
          stats={[
            {
              label: "Chiffre d'affaires théorique",
              value: renderMoneyMap(stats.theoreticalAmounts),
            },
            { label: 'Offerts', value: renderMoneyMap(stats.offeredAmounts) },
            { label: 'Remise', value: renderMoneyMap(stats.discountAmounts) },
            {
              label: "Chiffre d'affaires réel",
              value: renderMoneyMap(stats.realAmounts),
              emphasis: true,
            },
            { label: 'Dettes', value: renderMoneyMap(stats.remainingDebtAmounts) },
            { label: 'Cash', value: renderMoneyMap(stats.cashAmounts) },
            { label: 'Recouvrement', value: renderMoneyMap(stats.recoveryAmounts) },
            {
              label: 'Total encaissements',
              value: renderMoneyMap(stats.collectionAmounts),
              emphasis: true,
            },
          ]}
        />
        <DashboardPeriodicReportTable reports={periodicReports} />
      </PrintContainer>

      <Card className="bg-background">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Rapport des ventes</CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            disabled={paginatedReports.items.length === 0}
          >
            <Printer className="size-4" />
            Imprimer
          </Button>
        </CardHeader>
        <CardContent>
          {paginatedReports.items.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Aucun rapport"
              description="Aucune activité de vente ne correspond à cette période."
              className="border-none bg-transparent shadow-none"
            />
          ) : (
            <>
              {paginatedReports.totalLoadedPages > 1 && (
                <PaginationControls
                  canGoPrevious={paginatedReports.canGoPrevious}
                  canGoNext={paginatedReports.canGoNext}
                  pageSize={PERIODIC_REPORT_PAGE_SIZE}
                  onPrevious={paginatedReports.goToPreviousPage}
                  onNext={paginatedReports.goToNextPage}
                />
              )}

              <DashboardPeriodicReportTable reports={paginatedReports.visibleItems} />
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}

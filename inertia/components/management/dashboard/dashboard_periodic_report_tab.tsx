import { ClipboardList, Printer } from 'lucide-react'
import { EmptyState } from '~/components/common/empty_state'
import { PrintReportHeader } from '~/components/common/print_report_header'
import { DashboardPeriodicReportTable } from '~/components/management/dashboard/dashboard_periodic_report_table'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { TabsContent } from '~/components/ui/tabs'
import { usePaginated } from '~/hooks/use_paginated'
import { useSimplePrint } from '~/hooks/use_simple_print'
import type { DashboardPeriod, DashboardPeriodicReport } from '~/types/dashboard_types'
import { formatDateLabel } from '~/utils/date'

const PERIODIC_REPORT_PAGE_SIZE = 10

interface DashboardPeriodicReportTabProps {
  period: DashboardPeriod
  periodicReports: DashboardPeriodicReport[]
}

/**
 * Affiche le rapport périodique des ventes du dashboard.
 */
export function DashboardPeriodicReportTab({
  period,
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

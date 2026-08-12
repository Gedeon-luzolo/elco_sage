import { Package, Printer } from 'lucide-react'
import { EmptyState } from '~/components/common/empty_state'
import { PrintReportHeader } from '~/components/common/print_report_header'
import { DashboardStockReportTable } from '~/components/management/dashboard/dashboard_stock_report_table'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { TabsContent } from '~/components/ui/tabs'
import { usePaginated } from '~/hooks/use_paginated'
import { useSimplePrint } from '~/hooks/use_simple_print'
import type {
  DashboardPeriod,
  DashboardStockReport,
  DashboardStockReportRow,
} from '~/types/dashboard_types'
import { formatDateLabel } from '~/utils/date'

const STOCK_REPORT_PAGE_SIZE = 10

interface DashboardStockReportTabProps {
  period: DashboardPeriod
  stockReport: DashboardStockReport
}

/**
 * Affiche le rapport de stock agrégé sur la période du dashboard.
 */
export function DashboardStockReportTab({ period, stockReport }: DashboardStockReportTabProps) {
  // L'écran est paginé, l'impression reprend toutes les lignes chargées de la période.
  const paginatedReport = usePaginated<DashboardStockReportRow>({
    initialItems: stockReport.rows,
    pageSize: STOCK_REPORT_PAGE_SIZE,
  })
  const { PrintContainer, handlePrint } = useSimplePrint()

  return (
    <TabsContent value="stock-report">
      <PrintContainer>
        <PrintReportHeader
          title="Rapport de stock"
          description={`Période du ${formatDateLabel(period.startDate)} au ${formatDateLabel(
            period.endDate
          )}`}
        />
        <DashboardStockReportTable rows={stockReport.rows} totals={stockReport.totals} />
      </PrintContainer>

      <Card className="bg-background">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Rapport de stock</CardTitle>
            <CardDescription>
              Entrées, sorties, pertes et écarts par produit sur la période.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            disabled={paginatedReport.items.length === 0}
          >
            <Printer className="size-4" />
            Imprimer
          </Button>
        </CardHeader>
        <CardContent>
          {paginatedReport.items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Aucun mouvement de stock"
              description="Aucun mouvement de stock ne correspond à cette période."
              className="border-none bg-transparent shadow-none"
            />
          ) : (
            <>
              {paginatedReport.totalLoadedPages > 1 && (
                <PaginationControls
                  canGoPrevious={paginatedReport.canGoPrevious}
                  canGoNext={paginatedReport.canGoNext}
                  pageSize={STOCK_REPORT_PAGE_SIZE}
                  onPrevious={paginatedReport.goToPreviousPage}
                  onNext={paginatedReport.goToNextPage}
                />
              )}

              <DashboardStockReportTable
                rows={paginatedReport.visibleItems}
                totals={stockReport.totals}
              />
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}

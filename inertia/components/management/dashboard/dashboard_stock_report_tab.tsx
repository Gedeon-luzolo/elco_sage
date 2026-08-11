import { Package } from 'lucide-react'
import { EmptyState } from '~/components/common/empty_state'
import { StockReportRow } from '~/components/stock/stock_report_row'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { TabsContent } from '~/components/ui/tabs'
import {
  Table,
  TableBody,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { usePaginated } from '~/hooks/use_paginated'
import type { DashboardStockReport, DashboardStockReportRow } from '~/types/dashboard_types'

const STOCK_REPORT_PAGE_SIZE = 10

interface DashboardStockReportTabProps {
  stockReport: DashboardStockReport
}

/**
 * Affiche le rapport de stock agrégé sur la période du dashboard.
 */
export function DashboardStockReportTab({ stockReport }: DashboardStockReportTabProps) {
  // La pagination reste locale car les lignes sont déjà chargées par le dashboard.
  const paginatedReport = usePaginated<DashboardStockReportRow>({
    initialItems: stockReport.rows,
    pageSize: STOCK_REPORT_PAGE_SIZE,
  })

  return (
    <TabsContent value="stock-report">
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Rapport de stock</CardTitle>
          <CardDescription>
            Entrées, sorties, pertes et écarts par produit sur la période.
          </CardDescription>
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

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produits</TableHead>
                    <TableHead>Catégories</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead className="text-right">Initial</TableHead>
                    <TableHead className="text-right">Entrées</TableHead>
                    <TableHead className="text-right">Stock période</TableHead>
                    <TableHead className="text-right">Sorties</TableHead>
                    <TableHead className="text-right">Pertes</TableHead>
                    <TableHead className="text-right">Théorique final</TableHead>
                    <TableHead className="text-right">Physique</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReport.visibleItems.map((row) => (
                    <StockReportRow key={row.productId} row={row} />
                  ))}
                </TableBody>
                <TableFooter>
                  <StockReportRow row={stockReport.totals} isTotal />
                </TableFooter>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}

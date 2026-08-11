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

              <Table className="border border-border">
                <TableHeader className="[&_tr]:border-border">
                  <TableRow>
                    <TableHead rowSpan={2} className="border-r border-border">
                      Produits
                    </TableHead>
                    <TableHead rowSpan={2} className="border-r border-border">
                      Catégories
                    </TableHead>
                    <TableHead rowSpan={2} className="border-r border-border">
                      Unité
                    </TableHead>
                    <TableHead rowSpan={2} className="border-r border-border text-right">
                      SI
                    </TableHead>
                    <TableHead rowSpan={2} className="border-r border-border text-right">
                      Entrées
                    </TableHead>
                    <TableHead colSpan={2} className="border-r border-border text-center">
                      Stock période
                    </TableHead>
                    <TableHead colSpan={2} className="border-r border-border text-center">
                      Sorties
                    </TableHead>
                    <TableHead colSpan={2} className="border-r border-border text-center">
                      Pertes
                    </TableHead>
                    <TableHead rowSpan={2} className="border-r border-border text-right">
                      Stock Théo
                    </TableHead>
                    <TableHead colSpan={2} className="border-r border-border text-center">
                      Stock final
                    </TableHead>
                    <TableHead rowSpan={2} className="text-right">
                      Écart
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="border-r border-border text-right">Qté</TableHead>
                    <TableHead className="border-r border-border text-right">Valeur</TableHead>
                    <TableHead className="border-r border-border text-right">Qté</TableHead>
                    <TableHead className="border-r border-border text-right">Valeur</TableHead>
                    <TableHead className="border-r border-border text-right">Qté</TableHead>
                    <TableHead className="border-r border-border text-right">Valeur</TableHead>
                    <TableHead className="border-r border-border text-right">Qté</TableHead>
                    <TableHead className="border-r border-border text-right">Valeur</TableHead>
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

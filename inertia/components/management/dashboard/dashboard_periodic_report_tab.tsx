import { ClipboardList } from 'lucide-react'
import { EmptyState } from '~/components/common/empty_state'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { TabsContent } from '~/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { usePaginated } from '~/hooks/use_paginated'
import type { DashboardPeriodicReport } from '~/types/dashboard_types'
import { formatNumber } from '~/utils/format_number.utils'
import { renderMoneyMap } from '~/utils/money_map.utils'

const PERIODIC_REPORT_PAGE_SIZE = 10

interface DashboardPeriodicReportTabProps {
  periodicReports: DashboardPeriodicReport[]
}

/**
 * Affiche le rapport journalier des ventes du dashboard.
 */
export function DashboardPeriodicReportTab({ periodicReports }: DashboardPeriodicReportTabProps) {
  // La pagination reste locale: toutes les lignes de la période sont déjà chargées.
  const paginatedReports = usePaginated<DashboardPeriodicReport>({
    initialItems: periodicReports,
    pageSize: PERIODIC_REPORT_PAGE_SIZE,
  })

  return (
    <TabsContent value="sales-report">
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Rapport des ventes</CardTitle>
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

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Théorique</TableHead>
                    <TableHead className="text-right">Offerts</TableHead>
                    <TableHead className="text-right">Remise</TableHead>
                    <TableHead className="text-right">Réel</TableHead>
                    <TableHead className="text-right">Dettes</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="text-right">Recouvrement</TableHead>
                    <TableHead className="text-right">Total encaissements</TableHead>
                    <TableHead className="text-right">Bons</TableHead>
                    <TableHead className="text-right">Additions</TableHead>
                    <TableHead className="text-right">Services vendus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.visibleItems.map((report) => (
                    <TableRow key={report.date}>
                      <TableCell className="font-medium">{report.label}</TableCell>
                      <TableCell className="text-right">
                        {renderMoneyMap(report.theoreticalAmounts)}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderMoneyMap(report.offeredAmounts)}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderMoneyMap(report.discountAmounts)}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderMoneyMap(report.realAmounts)}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderMoneyMap(report.remainingDebtAmounts)}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderMoneyMap(report.cashAmounts)}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderMoneyMap(report.recoveryAmounts)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {renderMoneyMap(report.collectionAmounts)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(report.orderFormsCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(report.additionsCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(report.soldServicesCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}

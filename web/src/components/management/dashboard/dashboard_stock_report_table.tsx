import { StockReportRow } from '~/components/stock/stock_report_row'
import {
  Table,
  TableBody,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type { DashboardStockReport, DashboardStockReportRow } from '~/types/dashboard_types'

interface DashboardStockReportTableProps {
  rows: DashboardStockReportRow[]
  totals: DashboardStockReport['totals']
}

/**
 * Tableau du rapport de stock, partagé entre l'écran paginé et l'impression complète.
 */
export function DashboardStockReportTable({ rows, totals }: DashboardStockReportTableProps) {
  return (
    <Table className="border border-border print:text-[8px]">
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
        {rows.map((row) => (
          <StockReportRow key={row.productId} row={row} />
        ))}
      </TableBody>
      <TableFooter>
        <StockReportRow row={totals} isTotal />
      </TableFooter>
    </Table>
  )
}

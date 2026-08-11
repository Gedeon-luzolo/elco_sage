import { TableCell, TableRow } from '~/components/ui/table'
import type { DashboardStockReportRow } from '~/types/dashboard_types'
import { formatQuantity } from '~/utils/stock'

interface StockReportRowProps {
  row: DashboardStockReportRow
  isTotal?: boolean
}

/**
 * Affiche une ligne du rapport de stock.
 */
export function StockReportRow({ row, isTotal = false }: StockReportRowProps) {
  const unit = row.baseUnit ?? '-'

  return (
    <TableRow className={isTotal ? 'font-semibold' : undefined}>
      <TableCell>{row.productName}</TableCell>
      <TableCell>{row.categoryName ?? '-'}</TableCell>
      <TableCell>{unit}</TableCell>
      <TableCell className="text-right">{formatQuantity(row.periodInitialStock)}</TableCell>
      <TableCell className="text-right text-blue-600">{formatQuantity(row.totalEntries)}</TableCell>
      <TableCell className="text-right font-medium">{formatQuantity(row.periodStock)}</TableCell>
      <TableCell className="text-right text-red-600">{formatQuantity(row.totalOutputs)}</TableCell>
      <TableCell className="text-right text-orange-600">
        {formatQuantity(row.totalLosses)}
      </TableCell>
      <TableCell className="text-right">{formatQuantity(row.finalTheoreticalStock)}</TableCell>
      <TableCell className="text-right">{formatQuantity(row.lastPhysicalStock)}</TableCell>
      <TableCell className="text-right">
        {row.finalVariance === null ? (
          '-'
        ) : (
          <span className={Math.abs(row.finalVariance) > 0 ? 'text-amber-600' : 'text-emerald-600'}>
            {formatQuantity(row.finalVariance)}
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}

import { TableCell, TableRow } from '~/components/ui/table'
import type { DashboardStockReportRow } from '~/types/dashboard_types'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
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
      <TableCell className="border-r border-border">{row.productName}</TableCell>
      <TableCell className="border-r border-border">{row.categoryName ?? '-'}</TableCell>
      <TableCell className="border-r border-border">{unit}</TableCell>
      <TableCell className="border-r border-border text-right">
        {formatQuantity(row.periodInitialStock)}
      </TableCell>
      <TableCell className="border-r border-border text-right text-blue-600">
        {formatQuantity(row.totalEntries)}
      </TableCell>
      <TableCell className="border-r border-border text-right font-medium">
        {formatQuantity(row.periodStock)}
      </TableCell>
      <TableCell className="border-r border-border text-right font-medium">
        {formatMoneyWithCurrency(row.periodStockValueCdf, 'CDF')}
      </TableCell>
      <TableCell className="border-r border-border text-right text-red-600">
        {formatQuantity(row.totalOutputs)}
      </TableCell>
      <TableCell className="border-r border-border text-right text-red-600">
        {formatMoneyWithCurrency(row.outputsValueCdf, 'CDF')}
      </TableCell>
      <TableCell className="border-r border-border text-right text-orange-600">
        {formatQuantity(row.totalLosses)}
      </TableCell>
      <TableCell className="border-r border-border text-right text-orange-600">
        {formatMoneyWithCurrency(row.lossesValueCdf, 'CDF')}
      </TableCell>
      <TableCell className="border-r border-border text-right">
        {formatQuantity(row.finalTheoreticalStock)}
      </TableCell>
      <TableCell className="border-r border-border text-right">
        {formatQuantity(row.lastPhysicalStock)}
      </TableCell>
      <TableCell className="border-r border-border text-right">
        {row.physicalStockValueCdf === null
          ? '-'
          : formatMoneyWithCurrency(row.physicalStockValueCdf, 'CDF')}
      </TableCell>
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

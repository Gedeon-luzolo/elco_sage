import { TableCell, TableRow } from '~/components/ui/table'
import type { SaleItemRow } from '~/types/sale_types'
import type { CurrencyCode } from '~/utils/currency'
import { formatDateLabel } from '~/utils/date'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

interface SaleReportEmptySaleRowProps {
  sale: SaleItemRow
  saleIndex: number
}

export function SaleReportEmptySaleRow({ sale, saleIndex }: SaleReportEmptySaleRowProps) {
  const currency = sale.currency as CurrencyCode

  return (
    <TableRow className="align-top">
      <TableCell>{saleIndex + 1}</TableCell>
      <TableCell>{sale.saleDate ? formatDateLabel(sale.saleDate) : '-'}</TableCell>
      <TableCell className="font-medium">{sale.additionNumber}</TableCell>
      <TableCell>-</TableCell>
      <TableCell>{sale.customer?.fullName ?? '-'}</TableCell>
      <TableCell className="text-muted-foreground">Aucune ligne</TableCell>
      <TableCell className="text-center">-</TableCell>
      <TableCell className="text-right">-</TableCell>
      <TableCell className="text-right">
        {formatMoneyWithCurrency(sale.theoreticalAmount, currency)}
      </TableCell>
      <TableCell className="text-right text-red-600">
        {formatMoneyWithCurrency(sale.discountAmount, currency)}
      </TableCell>
      <TableCell className="text-right font-semibold text-green-600">
        {formatMoneyWithCurrency(sale.totalAmount, currency)}
      </TableCell>
      <TableCell>{sale.operatorName ?? '-'}</TableCell>
      <TableCell>{sale.paymentType}</TableCell>
    </TableRow>
  )
}

import { TableCell, TableRow } from '~/components/ui/table'
import type { SaleItem, SaleItemRow } from '~/types/sale_types'
import type { CurrencyCode } from '~/utils/currency'
import { formatDateLabel } from '~/utils/date'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import { formatSalePaymentLabel } from '~/utils/sales/payment.utils'

// Ligne d'un service dans le rapport ; isPending marque une vente pas encore envoyée au serveur.
interface SaleReportItemRowProps {
  sale: SaleItemRow
  item: SaleItem
  saleIndex: number
  isFirstLine: boolean
  isPending?: boolean
}

export function SaleReportItemRow({
  sale,
  item,
  saleIndex,
  isFirstLine,
  isPending = false,
}: SaleReportItemRowProps) {
  const itemCurrency = item.currency as CurrencyCode
  const saleCurrency = sale.currency as CurrencyCode

  return (
    <TableRow className="align-top">
      <TableCell>{isFirstLine ? saleIndex + 1 : ''}</TableCell>
      <TableCell>{isFirstLine && sale.saleDate ? formatDateLabel(sale.saleDate) : ''}</TableCell>
      <TableCell className="font-medium">
        {isFirstLine ? sale.additionNumber : ''}
        {/* Vente faite hors ligne : le serveur ne la connaît pas encore */}
        {isFirstLine && isPending && (
          <span className="ml-1 text-[10px] font-normal text-amber-600">Non envoyée</span>
        )}
      </TableCell>
      <TableCell>{isFirstLine ? (sale.customer?.fullName ?? '-') : ''}</TableCell>
      <TableCell className="min-w-56 whitespace-normal">
        <span className="font-medium">{item.productService?.name ?? 'Service inconnu'}</span>
      </TableCell>
      <TableCell className="text-center">
        {item.quantity}
      </TableCell>
      <TableCell className="text-right">
        {formatMoneyWithCurrency(item.unitPrice, itemCurrency)}
      </TableCell>
      <TableCell className="text-right font-semibold">
        {formatMoneyWithCurrency(item.totalPrice, itemCurrency)}
      </TableCell>
      <TableCell className="text-right text-red-600">
        {isFirstLine && sale.discountAmount > 0
          ? formatMoneyWithCurrency(sale.discountAmount, saleCurrency)
          : '-'}
      </TableCell>
      <TableCell className="text-right font-semibold text-green-600">
        {isFirstLine ? formatMoneyWithCurrency(sale.totalAmount, saleCurrency) : '-'}
      </TableCell>
      <TableCell>{isFirstLine ? (sale.operatorName ?? '-') : ''}</TableCell>
      <TableCell>{isFirstLine ? formatSalePaymentLabel(sale) : ''}</TableCell>
      <TableCell>{isFirstLine ? (sale.paymentReference ?? '-') : ''}</TableCell>
    </TableRow>
  )
}

import { DebtStatusBadge } from '~/components/sales/debt_status_badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import type { RecoveryPaymentItem } from '~/types/debt_types'
import type { CurrencyCode } from '~/utils/currency'
import { formatDateTimeLabel } from '~/utils/date'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import { formatDebtSaleDate, formatDebtStatusLabel } from '~/utils/sales/debt.utils'

interface RecoveriesTableProps {
  recoveries: RecoveryPaymentItem[]
  showStatusBadge?: boolean
}

/**
 * Tableau des paiements de recouvrement, réutilisé à l'écran et à l'impression.
 */
export function RecoveriesTable({ recoveries, showStatusBadge = true }: RecoveriesTableProps) {
  return (
    <Table className="print:text-[9px]">
      <TableHeader>
        <TableRow>
          <TableHead>Date de paiement</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Addition</TableHead>
          <TableHead>Date de vente</TableHead>
          <TableHead className="text-right">Montant payé</TableHead>
          <TableHead className="text-right">Total payé</TableHead>
          <TableHead className="text-right">Reste après paiement</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recoveries.map((payment) => (
          <TableRow key={payment.recovery.id}>
            <TableCell>{formatDateTimeLabel(payment.recovery.recoveredAt)}</TableCell>
            <TableCell>{payment.recovery.receivedByName ?? '-'}</TableCell>
            <TableCell>{payment.sale.customer?.fullName ?? '-'}</TableCell>
            <TableCell>{payment.sale.additionNumber}</TableCell>
            <TableCell>{formatDebtSaleDate(payment.sale.saleDate)}</TableCell>
            <TableCell className="text-right font-semibold">
              {formatMoneyWithCurrency(
                payment.paidAmount,
                payment.recovery.currency as CurrencyCode
              )}
            </TableCell>
            <TableCell className="text-right">
              {formatMoneyWithCurrency(
                payment.paidAfterAmount,
                payment.sale.currency as CurrencyCode
              )}
            </TableCell>
            <TableCell className="text-right">
              {formatMoneyWithCurrency(
                payment.remainingAmount,
                payment.sale.currency as CurrencyCode
              )}
            </TableCell>
            <TableCell>
              {showStatusBadge ? (
                <DebtStatusBadge status={payment.debtStatus} />
              ) : (
                formatDebtStatusLabel(payment.debtStatus)
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

import { CreditCard } from 'lucide-react'
import { DebtStatusBadge } from '~/components/sales/debt_status_badge'
import { Button } from '~/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import type { DebtItem } from '~/types/debt_types'
import type { CurrencyCode } from '~/utils/currency'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import { formatDebtSaleDate, formatDebtStatusLabel } from '~/utils/sales/debt.utils'

interface DebtsTableProps {
  debts: DebtItem[]
  onSelectDebt?: (debt: DebtItem) => void
  showActions?: boolean
  showStatusBadge?: boolean
}

/**
 * Tableau des dettes. Les actions et badges peuvent être masqués pour le rendu imprimé.
 */
export function DebtsTable({
  debts,
  onSelectDebt,
  showActions = true,
  showStatusBadge = true,
}: DebtsTableProps) {
  return (
    <Table className="print:text-[9px]">
      <TableHeader>
        <TableRow>
          <TableHead>Date de vente</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Addition</TableHead>
          <TableHead className="text-right">Dette totale</TableHead>
          <TableHead className="text-right">Déjà payé</TableHead>
          <TableHead className="text-right">Reste</TableHead>
          <TableHead>Statut</TableHead>
          {showActions && <TableHead className="text-right">Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {debts.map((debt) => (
          <TableRow key={debt.sale.id}>
            <TableCell>{formatDebtSaleDate(debt.sale.saleDate)}</TableCell>
            <TableCell>{debt.sale.customer?.fullName ?? '-'}</TableCell>
            <TableCell>{debt.sale.additionNumber}</TableCell>
            <TableCell className="text-right">
              {formatMoneyWithCurrency(debt.debtTotalAmount, debt.sale.currency as CurrencyCode)}
            </TableCell>
            <TableCell className="text-right">
              {formatMoneyWithCurrency(debt.recoveredAmount, debt.sale.currency as CurrencyCode)}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatMoneyWithCurrency(debt.remainingAmount, debt.sale.currency as CurrencyCode)}
            </TableCell>
            <TableCell>
              {showStatusBadge ? (
                <DebtStatusBadge status={debt.debtStatus} />
              ) : (
                formatDebtStatusLabel(debt.debtStatus)
              )}
            </TableCell>
            {showActions && (
              <TableCell className="text-right">
                <Button
                  type="button"
                  size="sm"
                  className="bg-red-800"
                  onClick={() => onSelectDebt?.(debt)}
                >
                  <CreditCard className="size-4" />
                  Payer
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

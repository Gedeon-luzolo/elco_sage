import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type { SaleItemRow } from '~/types/sale_types'
import { formatSaleMoney } from '~/utils/sales/sale.utils'

interface SalesTableProps {
  sales: SaleItemRow[]
  selectedSaleId: string | null
  onSelectSale: (saleId: string) => void
}

/**
 * Tableau de lecture des ventes de la session courante.
 */
export function SalesTable({ sales, selectedSaleId, onSelectSale }: SalesTableProps) {
  return (
    <div className="h-[70vh] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="h-full overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Addition</TableHead>
              <TableHead className="font-semibold">Bon</TableHead>
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="text-right font-semibold">Theorique</TableHead>
              <TableHead className="text-right font-semibold">Remise</TableHead>
              <TableHead className="text-right font-semibold">Total</TableHead>
              <TableHead className="font-semibold">Paiement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => {
              const isSelected = sale.id === selectedSaleId

              return (
                <TableRow
                  key={sale.id}
                  onClick={() => onSelectSale(sale.id)}
                  className={`cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                    isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                  }`}
                >
                  <TableCell className="font-medium">{sale.additionNumber}</TableCell>
                  <TableCell className="font-medium">
                    {[...new Set(sale.items.map((item) => item.orderNumber))].join(', ')}
                  </TableCell>
                  <TableCell>{sale.customer?.fullName ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    {formatSaleMoney(sale.theoreticalAmount, sale.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatSaleMoney(sale.discountAmount, sale.currency)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatSaleMoney(sale.totalAmount, sale.currency)}
                  </TableCell>
                  <TableCell>{sale.paymentType}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

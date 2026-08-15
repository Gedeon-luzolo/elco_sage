import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import type { SaleItemRow } from '~/types/sale_types'
import type { CurrencyCode } from '~/utils/currency'
import { formatDateTimeLabel } from '~/utils/date'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

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
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Vue mobile : les ventes deviennent des fiches tactiles au lieu d'un tableau large. */}
      <div className="grid gap-3 p-3 md:hidden">
        {sales.map((sale) => (
          <SaleMobileCard
            key={sale.id}
            sale={sale}
            isSelected={sale.id === selectedSaleId}
            onSelectSale={onSelectSale}
          />
        ))}
      </div>

      <div className="hidden h-[70vh] overflow-y-auto md:block">
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
                    {formatMoneyWithCurrency(sale.theoreticalAmount, sale.currency as CurrencyCode)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoneyWithCurrency(sale.discountAmount, sale.currency as CurrencyCode)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoneyWithCurrency(sale.totalAmount, sale.currency as CurrencyCode)}
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

function SaleMobileCard({
  sale,
  isSelected,
  onSelectSale,
}: {
  sale: SaleItemRow
  isSelected: boolean
  onSelectSale: (saleId: string) => void
}) {
  const orderNumbers = [...new Set(sale.items.map((item) => item.orderNumber))].join(', ')

  return (
    <button
      type="button"
      className={`grid w-full gap-3 rounded-lg border p-3 text-left transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
          : 'border-border bg-background hover:border-primary/50'
      }`}
      onClick={() => onSelectSale(sale.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Addition {sale.additionNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDateTimeLabel(sale.saleDate)}</p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {sale.paymentType}
        </Badge>
      </div>

      <div className="grid gap-1.5 text-xs">
        <MobileSaleMetric label="Client" value={sale.customer?.fullName ?? '-'} />
        <MobileSaleMetric label="Bon" value={orderNumbers || '-'} />
        <MobileSaleMetric
          label="Total"
          value={formatMoneyWithCurrency(sale.totalAmount, sale.currency as CurrencyCode)}
          strong
        />
      </div>
    </button>
  )
}

function MobileSaleMetric({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={`truncate text-right ${strong ? 'font-semibold' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  )
}

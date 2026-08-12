import { SaleReportEmptySaleRow } from '~/components/sales/sale_report/sale_report_empty_sale_row'
import { SaleReportItemRow } from '~/components/sales/sale_report/sale_report_item_row'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type { SaleReportTotals } from '~/types/cash_session_types'
import type { SaleItemRow } from '~/types/sale_types'
import { renderMoneyMap } from '~/utils/money_map.utils'

interface SaleReportTableProps {
  sales: SaleItemRow[]
  totals: SaleReportTotals
}

/**
 * Tableau partagé entre l'écran et l'impression du rapport journalier.
 */
export function SaleReportTable({ sales, totals }: SaleReportTableProps) {
  return (
    <Table className="text-sm print:text-[9px]">
      <TableHeader className="bg-black/50 text-white print:bg-black print:text-white [&_th]:text-white [&_tr]:border-black">
        <TableRow>
          <TableHead className="w-12">N°</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>N° Add</TableHead>
          <TableHead>N° BC</TableHead>
          <TableHead>Clients</TableHead>
          <TableHead>Services</TableHead>
          <TableHead className="text-center">Qté</TableHead>
          <TableHead className="text-right">PU</TableHead>
          <TableHead className="text-right">Total théorique</TableHead>
          <TableHead className="text-right">Remise</TableHead>
          <TableHead className="text-right">Total réel</TableHead>
          <TableHead>Opérateurs</TableHead>
          <TableHead>Paiements</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Une vente peut avoir plusieurs services; les infos vente restent sur la première ligne. */}
        {sales.flatMap((sale, saleIndex) =>
          sale.items.length > 0
            ? sale.items.map((item, itemIndex) => (
                <SaleReportItemRow
                  key={item.id}
                  sale={sale}
                  item={item}
                  saleIndex={saleIndex}
                  isFirstLine={itemIndex === 0}
                />
              ))
            : [<SaleReportEmptySaleRow key={sale.id} sale={sale} saleIndex={saleIndex} />]
        )}
      </TableBody>
      <TableFooter className="border-black bg-black/50 text-white print:bg-black print:text-white [&_td]:text-white">
        <TableRow>
          <TableCell colSpan={8} className="font-semibold">
            Totaux généraux
          </TableCell>
          <TableCell className="text-right font-bold">
            {renderMoneyMap(totals.theoreticalAmounts)}
          </TableCell>
          <TableCell className="text-right font-bold text-red-200">
            {renderMoneyMap(totals.discountAmounts)}
          </TableCell>
          <TableCell className="text-right font-bold text-green-200">
            {renderMoneyMap(totals.realAmounts)}
          </TableCell>
          <TableCell colSpan={2} />
        </TableRow>
      </TableFooter>
    </Table>
  )
}

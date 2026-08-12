import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type { DashboardPeriodicReport } from '~/types/dashboard_types'
import { formatNumber } from '~/utils/format_number.utils'
import { renderMoneyMap } from '~/utils/money_map.utils'

interface DashboardPeriodicReportTableProps {
  reports: DashboardPeriodicReport[]
}

/**
 * Tableau du rapport périodique des ventes, utilisé par l'onglet et son rendu imprimable.
 */
export function DashboardPeriodicReportTable({ reports }: DashboardPeriodicReportTableProps) {
  return (
    <Table className="print:text-[9px]">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Théorique</TableHead>
          <TableHead className="text-right">Offerts</TableHead>
          <TableHead className="text-right">Remise</TableHead>
          <TableHead className="text-right">Réel</TableHead>
          <TableHead className="text-right">Dettes</TableHead>
          <TableHead className="text-right">Cash</TableHead>
          <TableHead className="text-right">Recouvrement</TableHead>
          <TableHead className="text-right">Total encaissements</TableHead>
          <TableHead className="text-right">Bons</TableHead>
          <TableHead className="text-right">Additions</TableHead>
          <TableHead className="text-right">Services vendus</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.date}>
            <TableCell className="font-medium">{report.label}</TableCell>
            <TableCell className="text-right">{renderMoneyMap(report.theoreticalAmounts)}</TableCell>
            <TableCell className="text-right">{renderMoneyMap(report.offeredAmounts)}</TableCell>
            <TableCell className="text-right">{renderMoneyMap(report.discountAmounts)}</TableCell>
            <TableCell className="text-right">{renderMoneyMap(report.realAmounts)}</TableCell>
            <TableCell className="text-right">{renderMoneyMap(report.remainingDebtAmounts)}</TableCell>
            <TableCell className="text-right">{renderMoneyMap(report.cashAmounts)}</TableCell>
            <TableCell className="text-right">{renderMoneyMap(report.recoveryAmounts)}</TableCell>
            <TableCell className="text-right font-semibold">
              {renderMoneyMap(report.collectionAmounts)}
            </TableCell>
            <TableCell className="text-right">{formatNumber(report.orderFormsCount)}</TableCell>
            <TableCell className="text-right">{formatNumber(report.additionsCount)}</TableCell>
            <TableCell className="text-right">{formatNumber(report.soldServicesCount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

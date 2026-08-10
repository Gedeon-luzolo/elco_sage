import { TrendingUp } from 'lucide-react'
import { EmptyState } from '~/components/common/empty_state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { TabsContent } from '~/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type {
  DashboardStaffProductivity,
  DashboardStaffProductivityRow,
} from '~/types/dashboard_types'
import { formatNumber } from '~/utils/format_number.utils'
import { renderMoneyMap } from '~/utils/money_map.utils'

interface DashboardStaffProductivityTabProps {
  staffProductivity: DashboardStaffProductivity
}

export function DashboardStaffProductivityTab({
  staffProductivity,
}: DashboardStaffProductivityTabProps) {
  return (
    <TabsContent value="staff-productivity">
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Productivité du personnel</CardTitle>
          <CardDescription>
            Ventes par opérateur et recouvrements par agent qui a perçu le paiement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staffProductivity.rows.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Aucune productivité"
              description="Aucune vente ou perception ne correspond à cette période."
              className="border-none bg-transparent shadow-none"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Personnel</TableHead>
                  <TableHead className="text-right">Additions</TableHead>
                  <TableHead className="text-right">Bons</TableHead>
                  <TableHead className="text-right">Chiffre réel</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">Recouvrement</TableHead>
                  <TableHead className="text-right">Encaissements</TableHead>
                  <TableHead className="text-right">Dettes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffProductivity.rows.map((row) => (
                  <StaffProductivityRow key={row.staffId} row={row} />
                ))}
              </TableBody>
              <TableFooter>
                <StaffProductivityRow row={staffProductivity.totals} isTotal />
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}

interface StaffProductivityRowProps {
  row: DashboardStaffProductivityRow
  isTotal?: boolean
}

function StaffProductivityRow({ row, isTotal = false }: StaffProductivityRowProps) {
  return (
    <TableRow className={isTotal ? 'font-semibold' : undefined}>
      <TableCell>{row.staffName}</TableCell>
      <TableCell className="text-right">{formatNumber(row.additionsCount)}</TableCell>
      <TableCell className="text-right">{formatNumber(row.orderFormsCount)}</TableCell>
      <TableCell className="text-right">{renderMoneyMap(row.realAmounts)}</TableCell>
      <TableCell className="text-right">{renderMoneyMap(row.cashAmounts)}</TableCell>
      <TableCell className="text-right">{renderMoneyMap(row.recoveryAmounts)}</TableCell>
      <TableCell className="text-right">{renderMoneyMap(row.collectionAmounts)}</TableCell>
      <TableCell className="text-right">{renderMoneyMap(row.remainingDebtAmounts)}</TableCell>
    </TableRow>
  )
}

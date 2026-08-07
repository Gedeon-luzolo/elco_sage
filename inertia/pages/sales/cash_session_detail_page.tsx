import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, ReceiptText, UserRound } from 'lucide-react'
import { SaleReportEmptySaleRow } from '~/components/sales/sale_report/sale_report_empty_sale_row'
import { SaleReportItemRow } from '~/components/sales/sale_report/sale_report_item_row'
import { TotalText } from '~/components/sales/sale_report/total_text'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type { InertiaProps } from '~/types'
import type { CashSessionDetailPageProps } from '~/types/cash_session_types'
import { formatDateTimeLabel } from '~/utils/date'
import { renderMoneyMap } from '~/utils/money_map.utils'

export default function CashSessionDetailPage({
  session,
  sales,
  totals,
}: InertiaProps<CashSessionDetailPageProps>) {
  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <section className="flex w-full flex-col gap-6 px-6 py-8 lg:px-10">
        <Card className="bg-background">
          <CardContent className="flex flex-col gap-3 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
              <div className="min-w-52">
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="size-4 text-muted-foreground" />
                  Détails de ventes
                </CardTitle>
                <CardDescription>
                  Session {session.status === 'OPEN' ? 'ouverte' : 'fermée'}
                </CardDescription>
              </div>
              <InfoLine label="Caissier" value={session.userName ?? 'Utilisateur'} />
              <InfoLine label="Rôle" value={session.userRole ?? '-'} />
              <InfoLine label="Ouverture" value={formatDateTimeLabel(session.openedAt)} />
              <InfoLine label="Fermeture" value={formatDateTimeLabel(session.closedAt)} />
            </div>
            <Button render={<Link href="/sales/sessions" />} variant="outline">
              <ArrowLeft className="size-4" />
              Quitter
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted">
                <ReceiptText className="size-5" />
              </span>
              <div>
                <CardTitle>Mouvements de ventes</CardTitle>
                <CardDescription>
                  {sales.length} vente(s) active(s) dans cette session
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table className="text-sm">
              <TableHeader className="bg-black/50 text-white [&_th]:text-white [&_tr]:border-black">
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
                {/* Faire le flattening des ventes */}
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
              <TableFooter className="border-black bg-black/50 text-white [&_td]:text-white">
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
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <CardTitle>Totaux généraux</CardTitle>
            <CardDescription>Répartition financière de la session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                <TotalText label="Cash" value={renderMoneyMap(totals.cashAmounts)} />
                <TotalText label="Dettes" value={renderMoneyMap(totals.debtAmounts)} />
                <TotalText label="Réel" value={renderMoneyMap(totals.realAmounts)} highlight />
                <TotalText label="Théorique" value={renderMoneyMap(totals.theoreticalAmounts)} />
                <TotalText label="Remises" value={renderMoneyMap(totals.discountAmounts)} danger />
                <TotalText label="Recouvrements" value={renderMoneyMap(totals.recoveryAmounts)} />
              </div>
              <div className="text-left lg:text-right">
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Total encaissement
                </p>
                <div className="text-2xl font-bold text-green-700">
                  {renderMoneyMap(totals.collectionAmounts)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <UserRound className="size-4" />
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, Printer, ReceiptText } from 'lucide-react'
import type { ReactNode } from 'react'
import { PrintReportHeader } from '~/components/common/print_report_header'
import { SaleReportTable } from '~/components/sales/sale_report/sale_report_table'
import { SaleReportTotalSection } from '~/components/sales/sale_report/sale_report_total_section'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useSimplePrint } from '~/hooks/use_simple_print'
import type { InertiaProps } from '~/types'
import type { CashSessionDetailPageProps } from '~/types/cash_session_types'
import { formatDateTimeLabel } from '~/utils/date'
import { renderMoneyMap } from '~/utils/money_map.utils'

export default function CashSessionDetailPage({
  session,
  sales,
  totals,
}: InertiaProps<CashSessionDetailPageProps>) {
  const { PrintContainer, handlePrint } = useSimplePrint()
  const renderSessionHeaderDetails = () => (
    <>
      <HeaderDetail label="Caissier" value={session.userName ?? 'Utilisateur'} />
      <HeaderDetail label="Ouverture" value={formatDateTimeLabel(session.openedAt)} />
      <HeaderDetail label="Fermeture" value={formatDateTimeLabel(session.closedAt)} />
      <HeaderDetail label="Système" value={renderMoneyMap(session.systemAmounts)} strong />
      <HeaderDetail label="Physique" value={renderMoneyMap(session.closingAmounts)} strong />
      <HeaderDetail label="Écart" value={renderMoneyMap(session.differenceAmounts)} strong />
    </>
  )

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <PrintContainer>
        <PrintReportHeader
          title="Rapport journalier des ventes"
          details={renderSessionHeaderDetails()}
        />
        <SaleReportTable sales={sales} totals={totals} />
        <SaleReportTotalSection totals={totals} />
      </PrintContainer>

      <section className="flex w-full flex-col gap-6 px-6 py-8 lg:px-10">
        <PrintReportHeader
          title="Rapport journalier des ventes"
          details={renderSessionHeaderDetails()}
          actions={
            <Button render={<Link href="/sales/sessions" />} variant="outline">
              <ArrowLeft className="size-4" />
              Quitter
            </Button>
          }
        />

        <Card className="bg-background">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Printer className="size-4" />
              Imprimer
            </Button>
          </CardHeader>
          <CardContent>
            <SaleReportTable sales={sales} totals={totals} />
          </CardContent>
        </Card>

        <SaleReportTotalSection totals={totals} />
      </section>
    </main>
  )
}

function HeaderDetail({
  label,
  value,
  strong = false,
}: {
  label: string
  value: ReactNode
  strong?: boolean
}) {
  return (
    <span className="text-gray-700">
      {label}:{' '}
      <strong className={strong ? 'text-gray-950' : 'font-medium text-gray-900'}>{value}</strong>
    </span>
  )
}

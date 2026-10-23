import { AppLink as Link } from '~/components/common/app_link'
import { ArrowLeft, Printer, ReceiptText } from 'lucide-react'
import type { ReactNode } from 'react'
import { PrintReportHeader } from '~/components/common/print_report_header'
import { SaleReportTable } from '~/components/sales/sale_report/sale_report_table'
import { SaleReportTotalSection } from '~/components/sales/sale_report/sale_report_total_section'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useSimplePrint } from '~/hooks/use_simple_print'
import { useParams } from 'react-router-dom'
import { DataLoader } from '~/components/common/data_loader'
import { useMemo } from 'react'
import { useCrud } from '~/hooks/common/useCrud'
import { usePendingActivity } from '~/hooks/sales/usePendingActivity'
import { countPendingActivity, mergePendingTotals } from '~/lib/offline/pending_report'
import type {
  CashSessionDetailPageProps,
  CashSessionItem,
  SaleReportTotals,
} from '~/types/cash_session_types'
import type { SaleItemRow } from '~/types/sale_types'
import { formatDateTimeLabel } from '~/utils/date'
import { renderMoneyMap } from '~/utils/money_map.utils'

export default function CashSessionDetailPage() {
  const { id = '' } = useParams()
  const { data: report } = useCrud<CashSessionDetailPageProps>({
    endpoint: '/cash-sessions',
  }).useGet(id)

  // Les ventes et recouvrements faits hors ligne sur cette session s'ajoutent au rapport du serveur
  const pending = usePendingActivity(report?.session)
  const merged = useMemo(() => {
    if (!report) return null

    return {
      sales: [...report.sales, ...pending.sales].sort((a, b) =>
        String(a.saleDate).localeCompare(String(b.saleDate))
      ),
      totals: mergePendingTotals(report.totals, pending),
    }
  }, [report, pending])

  if (!report || !merged) {
    return <DataLoader title="Chargement de la session..." />
  }

  return (
    <CashSessionDetail
      session={report.session}
      sales={merged.sales}
      totals={merged.totals}
      pendingSaleIds={new Set(pending.sales.map((sale) => sale.id))}
      pendingCount={countPendingActivity(pending)}
    />
  )
}

// Propriétés du rapport de session : le contenu fusionné et ce qui reste à envoyer au serveur.
type CashSessionDetailProps = {
  session: CashSessionItem
  sales: SaleItemRow[]
  totals: SaleReportTotals
  pendingSaleIds: Set<string>
  pendingCount: number
}

function CashSessionDetail({
  session,
  sales,
  totals,
  pendingSaleIds,
  pendingCount,
}: CashSessionDetailProps) {
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
        <SaleReportTable sales={sales} totals={totals} pendingSaleIds={pendingSaleIds} />
        <SaleReportTotalSection totals={totals} pendingCount={pendingCount} />
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
            <SaleReportTable sales={sales} totals={totals} pendingSaleIds={pendingSaleIds} />
          </CardContent>
        </Card>

        <SaleReportTotalSection totals={totals} pendingCount={pendingCount} />
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

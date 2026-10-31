import { AppLink as Link } from '~/components/common/app_link'
import {
  ArrowLeft,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  Printer,
  ReceiptText,
  Search,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataLoader } from '~/components/common/data_loader'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { PrintReportHeader } from '~/components/common/print_report_header'
import { SearchInput } from '~/components/common/search_input'
import { StatCard } from '~/components/common/stat_card'
import { DebtPaymentDialog } from '~/components/sales/debt_payment_dialog'
import { DebtsTable } from '~/components/sales/debts_table'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { PeriodSelector } from '~/components/ui/period_selector'
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table'
import { usePaginated } from '~/hooks/use_paginated'
import { useSearch } from '~/hooks/use_search'
import { useSelectionDate } from '~/hooks/use_selection_date'
import { useSimplePrint } from '~/hooks/use_simple_print'
import { useCrud } from '~/hooks/common/useCrud'
import { useCurrentCashSession } from '~/hooks/sales/useCashSession'
import { useOutbox } from '~/hooks/useOutbox'
import { applyPendingRecoveries } from '~/lib/offline/pending_debts'
import type { DebtItem, DebtStats, DebtsPageProps } from '~/types/debt_types'
import { formatDateLabel } from '~/utils/date'
import { renderMoneyMap } from '~/utils/money_map.utils'
import { debtSearchFields } from '~/utils/sales/debt.utils'

const DEBTS_PAGE_SIZE = 10

const EMPTY_DEBTS: DebtItem[] = []
const EMPTY_STATS: DebtStats = {
  totalDebts: 0,
  totalDebtAmounts: {},
  recoveredAmounts: {},
  remainingAmounts: {},
}

export default function DebtsPage() {
  const selectionDate = useSelectionDate()
  // Sans filtre au premier chargement ; la période n'est envoyée qu'au clic sur "Chercher"
  const [appliedPeriod, setAppliedPeriod] = useState<{ startDate?: string; endDate?: string }>({})
  const { data, isFetching: isLoading } = useCrud<DebtItem>({
    endpoint: '/debts',
  }).useGetWithParams<Pick<DebtsPageProps, 'debts' | 'stats'>>(appliedPeriod)
  // Un paiement entre dans la caisse de celui qui l'encaisse : sans session ouverte, pas de bouton Payer
  const { data: currentCashSession } = useCurrentCashSession()

  // Les recouvrements faits hors ligne sont déduits des dettes du serveur en attendant leur envoi
  const outbox = useOutbox()
  const { debts, stats } = useMemo(
    () => applyPendingRecoveries(data?.debts ?? EMPTY_DEBTS, data?.stats ?? EMPTY_STATS, outbox),
    [data, outbox]
  )
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null)
  const { PrintContainer, handlePrint } = useSimplePrint({
    orientation: 'portrait',
  })

  const {
    search,
    setSearch,
    filteredItems: filteredDebts,
    hasSearch,
  } = useSearch({
    items: debts,
    fields: debtSearchFields,
  })

  const paginatedDebts = usePaginated<DebtItem>({
    initialItems: filteredDebts,
    pageSize: DEBTS_PAGE_SIZE,
  })

  // L'écran reste paginé, mais l'impression reprend tout si aucune recherche n'est active.
  const debtsToPrint = hasSearch ? filteredDebts : debts

  const statCards = [
    {
      label: 'Nombre de dettes',
      value: stats.totalDebts,
      color: 'blue' as const,
      icon: ReceiptText,
    },
    {
      label: 'Valeur des dettes',
      value: renderMoneyMap(stats.totalDebtAmounts),
      color: 'amber' as const,
      icon: CircleDollarSign,
    },
    {
      label: 'Reste à payer',
      value: renderMoneyMap(stats.remainingAmounts),
      color: 'rose' as const,
      icon: Wallet,
    },
  ]

  const searchDebts = () => {
    setAppliedPeriod({ startDate: selectionDate.startDate, endDate: selectionDate.endDate })
  }

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <PrintContainer>
        <PrintReportHeader
          title="Rapport des dettes"
          description={`Période du ${formatDateLabel(selectionDate.startDate)} au ${formatDateLabel(
            selectionDate.endDate
          )}${hasSearch ? ` - Recherche: ${search.trim()}` : ''}`}
        />
        <DebtsTable debts={debtsToPrint} showActions={false} showStatusBadge={false} />
      </PrintContainer>

      <section className="flex w-full flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader
          title="Gestion des dettes"
          description="Suivre les ventes à crédit et encaisser les paiements restants."
          icon={CreditCard}
          accentClassName="bg-red-800 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        >
          <PeriodSelector
            startDate={selectionDate.startDate}
            endDate={selectionDate.endDate}
            onDateChange={selectionDate.handleDateChange}
            onSearch={searchDebts}
            isLoading={isLoading}
            className="w-full lg:w-auto"
            hideCardWrapper
          />
          <Button render={<Link href="/sales" />} variant="outline">
            <ArrowLeft className="size-4" />
            Ventes
          </Button>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-500/80 hover:text-white"
            render={<Link href="/sales/recoveries" />}
            variant="outline"
          >
            <HandCoins className="size-4" />
            Recouvrements
          </Button>
        </PageHeader>

        {isLoading ? (
          <DataLoader title="Chargement des dettes..." />
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {statCards.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  color={stat.color}
                  icon={stat.icon}
                />
              ))}
            </section>

            <Card className="bg-background">
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-md bg-muted">
                    <Search className="size-5" />
                  </span>
                  <div>
                    <CardTitle>Dettes en cours</CardTitle>
                    <CardDescription>
                      Page {paginatedDebts.currentPage} - {paginatedDebts.loadedItemsCount} dette(s)
                      chargée(s)
                    </CardDescription>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Rechercher client ou facture..."
                    className="w-full lg:w-72"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrint}
                    disabled={debtsToPrint.length === 0}
                  >
                    <Printer className="size-4" />
                    Imprimer
                  </Button>

                  {paginatedDebts.totalLoadedPages > 1 && (
                    <PaginationControls
                      currentPage={paginatedDebts.currentPage}
                      totalPages={paginatedDebts.totalLoadedPages}
                      onPageChange={paginatedDebts.goToPage}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {paginatedDebts.items.length === 0 ? (
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={8} className="h-64">
                          <EmptyState
                            icon={Search}
                            title="Aucune dette trouvée"
                            description="Aucune vente à crédit non soldée ne correspond à cette période."
                            className="border-none bg-transparent shadow-none"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <DebtsTable
                    debts={paginatedDebts.visibleItems}
                    onSelectDebt={setSelectedDebt}
                    showActions={Boolean(currentCashSession)}
                  />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <DebtPaymentDialog
        debt={selectedDebt}
        onOpenChange={(open) => {
          if (!open) setSelectedDebt(null)
        }}
      />
    </main>
  )
}

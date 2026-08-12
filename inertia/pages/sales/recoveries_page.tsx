import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  Printer,
  ReceiptText,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { DataLoader } from '~/components/common/data_loader'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { PrintReportHeader } from '~/components/common/print_report_header'
import { SearchInput } from '~/components/common/search_input'
import { StatCard } from '~/components/common/stat_card'
import { RecoveriesTable } from '~/components/sales/recoveries_table'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { PeriodSelector } from '~/components/ui/period_selector'
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table'
import { usePaginated } from '~/hooks/use_paginated'
import { useSearch } from '~/hooks/use_search'
import { useSelectionDate } from '~/hooks/use_selection_date'
import { useSimplePrint } from '~/hooks/use_simple_print'
import type { InertiaProps } from '~/types'
import type { RecoveriesPageProps, RecoveryPaymentItem } from '~/types/debt_types'
import { formatDateLabel } from '~/utils/date'
import { renderMoneyMap } from '~/utils/money_map.utils'
import { recoverySearchFields } from '~/utils/sales/debt.utils'

const RECOVERIES_PAGE_SIZE = 10

export default function RecoveriesPage({
  recoveries,
  filters,
  stats,
}: InertiaProps<RecoveriesPageProps>) {
  const selectionDate = useSelectionDate({
    initialStartDate: filters.startDate,
    initialEndDate: filters.endDate,
  })
  const [isLoading, setIsLoading] = useState(false)
  const { PrintContainer, handlePrint } = useSimplePrint()

  const {
    search,
    setSearch,
    filteredItems: filteredRecoveries,
    hasSearch,
  } = useSearch({
    items: recoveries,
    fields: recoverySearchFields,
  })

  const paginatedRecoveries = usePaginated<RecoveryPaymentItem>({
    initialItems: filteredRecoveries,
    pageSize: RECOVERIES_PAGE_SIZE,
  })

  // Sans recherche, l'impression ignore la pagination frontend et reprend tout le jeu chargé.
  const recoveriesToPrint = hasSearch ? filteredRecoveries : recoveries

  const statCards = [
    {
      label: 'Nombre de paiements',
      value: stats.totalDebts,
      color: 'emerald' as const,
      icon: CheckCircle2,
    },
    {
      label: 'Dettes concernées',
      value: renderMoneyMap(stats.totalDebtAmounts),
      color: 'blue' as const,
      icon: ReceiptText,
    },
    {
      label: 'Total recouvré',
      value: renderMoneyMap(stats.recoveredAmounts),
      color: 'teal' as const,
      icon: HandCoins,
    },
    {
      label: 'Reste actuel',
      value: renderMoneyMap(stats.remainingAmounts),
      color: 'neutral' as const,
      icon: CircleDollarSign,
    },
  ]

  const searchRecoveries = () => {
    setIsLoading(true)
    router.get(
      '/sales/recoveries',
      {
        startDate: selectionDate.startDate,
        endDate: selectionDate.endDate,
      },
      {
        preserveState: false,
        preserveScroll: true,
        onFinish: () => setIsLoading(false),
      }
    )
  }

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <PrintContainer>
        <PrintReportHeader
          title="Rapport des recouvrements"
          description={`Période du ${formatDateLabel(selectionDate.startDate)} au ${formatDateLabel(
            selectionDate.endDate
          )}${hasSearch ? ` - Recherche: ${search.trim()}` : ''}`}
        />
        <RecoveriesTable recoveries={recoveriesToPrint} showStatusBadge={false} />
      </PrintContainer>

      <section className="flex w-full flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader
          title="Recouvrements de dettes"
          description="Consulter l'historique des paiements associés aux dettes sur la période sélectionnée."
          icon={CheckCircle2}
          accentClassName="from-emerald-600 to-teal-600"
        >
          <PeriodSelector
            startDate={selectionDate.startDate}
            endDate={selectionDate.endDate}
            onDateChange={selectionDate.handleDateChange}
            onSearch={searchRecoveries}
            isLoading={isLoading}
            className="w-full lg:w-auto"
            hideCardWrapper
          />
          <Button
            className="bg-red-800 text-white hover:bg-red-500/80 hover:text-white"
            render={<Link href="/sales/debts" />}
            variant="outline"
          >
            <CreditCard className="size-4" />
            Dettes
          </Button>
          <Button
            className="bg-blue-800 text-white hover:bg-blue-500/80 hover:text-white"
            render={<Link href="/sales" />}
            variant="outline"
          >
            <ArrowLeft className="size-4" />
            Ventes
          </Button>
        </PageHeader>

        {isLoading ? (
          <DataLoader title="Chargement des recouvrements..." />
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                    <CardTitle>Historique des paiements</CardTitle>
                    <CardDescription>
                      Page {paginatedRecoveries.currentPage} -{' '}
                      {paginatedRecoveries.loadedItemsCount} paiement(s) chargé(s)
                    </CardDescription>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Rechercher client ou addition..."
                    className="w-full lg:w-72"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrint}
                    disabled={recoveriesToPrint.length === 0}
                  >
                    <Printer className="size-4" />
                    Imprimer
                  </Button>

                  {paginatedRecoveries.totalLoadedPages > 1 && (
                    <PaginationControls
                      canGoPrevious={paginatedRecoveries.canGoPrevious}
                      canGoNext={paginatedRecoveries.canGoNext}
                      pageSize={RECOVERIES_PAGE_SIZE}
                      onPrevious={paginatedRecoveries.goToPreviousPage}
                      onNext={paginatedRecoveries.goToNextPage}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {paginatedRecoveries.items.length === 0 ? (
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={9} className="h-64">
                          <EmptyState
                            icon={Search}
                            title="Aucun paiement trouvé"
                            description="Aucun paiement de dette ne correspond à cette période."
                            className="border-none bg-transparent shadow-none"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <RecoveriesTable recoveries={paginatedRecoveries.visibleItems} />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </section>
    </main>
  )
}

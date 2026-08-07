import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import {
  ArrowLeft,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  ReceiptText,
  Search,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { StatCard } from '~/components/common/stat_card'
import { DebtStatusBadge } from '~/components/sales/debt_status_badge'
import { DebtPaymentDialog } from '~/components/sales/debt_payment_dialog'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { PeriodSelector } from '~/components/ui/period_selector'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { usePaginated } from '~/hooks/use_paginated'
import { useSelectionDate } from '~/hooks/use_selection_date'
import type { InertiaProps } from '~/types'
import type { DebtItem, DebtsPageProps } from '~/types/debt_types'
import type { CurrencyCode } from '~/utils/currency'
import { formatDebtSaleDate } from '~/utils/sales/debt.utils'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import { renderMoneyMap } from '~/utils/money_map.utils'

const DEBTS_PAGE_SIZE = 10

export default function DebtsPage({ debts, filters, stats }: InertiaProps<DebtsPageProps>) {
  // Utiliser un hook pour gérer la sélection de période, avec des dates initiales provenant des filtres de la page.
  const selectionDate = useSelectionDate({
    initialStartDate: filters.startDate,
    initialEndDate: filters.endDate,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null)
  // Utiliser un hook de pagination pour gérer la pagination locale des dettes chargées.
  const paginatedDebts = usePaginated<DebtItem>({
    initialItems: debts,
    pageSize: DEBTS_PAGE_SIZE,
  })

  const redirectTo = `/sales/debts?startDate=${selectionDate.startDate}&endDate=${selectionDate.endDate}`

  // Les statistiques viennent du backend pour rester alignées avec la période filtrée.
  const statCards = [
    { label: 'Dettes', value: stats.totalDebts, color: 'blue' as const, icon: ReceiptText },
    {
      label: 'Valeur des dettes',
      value: renderMoneyMap(stats.totalDebtAmounts),
      color: 'amber' as const,
      icon: CircleDollarSign,
    },
    {
      label: 'Déjà payé',
      value: renderMoneyMap(stats.recoveredAmounts),
      color: 'emerald' as const,
      icon: HandCoins,
    },
    {
      label: 'Reste à payer',
      value: renderMoneyMap(stats.remainingAmounts),
      color: 'rose' as const,
      icon: Wallet,
    },
  ]

  // Applique la période via Inertia; la pagination reste locale.
  const searchDebts = () => {
    setIsLoading(true)
    router.get(
      '/sales/debts',
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
      <section className="flex w-full flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader
          title="Gestion des dettes"
          description="Suivre les ventes à crédit et encaisser les paiements restants."
          icon={CreditCard}
          accentClassName='bg-red-800 text-red-600 dark:bg-red-900/30 dark:text-red-400'
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
        </PageHeader>

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
                <CardTitle>Dettes en cours</CardTitle>
                <CardDescription>
                  Page {paginatedDebts.currentPage} - {paginatedDebts.loadedItemsCount} dette(s)
                  chargée(s)
                </CardDescription>
              </div>
            </div>

            {paginatedDebts.totalLoadedPages > 1 && (
              <PaginationControls
                canGoPrevious={paginatedDebts.canGoPrevious}
                canGoNext={paginatedDebts.canGoNext}
                pageSize={DEBTS_PAGE_SIZE}
                onPrevious={paginatedDebts.goToPreviousPage}
                onNext={paginatedDebts.goToNextPage}
              />
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date de vente</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Addition</TableHead>
                  <TableHead className="text-right">Dette totale</TableHead>
                  <TableHead className="text-right">Déjà payé</TableHead>
                  <TableHead className="text-right">Reste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDebts.visibleItems.map((debt) => (
                  <TableRow key={debt.sale.id}>
                    <TableCell>{formatDebtSaleDate(debt.sale.saleDate)}</TableCell>
                    <TableCell>{debt.sale.customer?.fullName ?? '-'}</TableCell>
                    <TableCell>{debt.sale.additionNumber}</TableCell>
                    <TableCell className="text-right">
                      {formatMoneyWithCurrency(
                        debt.debtTotalAmount,
                        debt.sale.currency as CurrencyCode
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoneyWithCurrency(
                        debt.recoveredAmount,
                        debt.sale.currency as CurrencyCode
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatMoneyWithCurrency(
                        debt.remainingAmount,
                        debt.sale.currency as CurrencyCode
                      )}
                    </TableCell>
                    <TableCell>
                      <DebtStatusBadge status={debt.debtStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-red-800"
                        onClick={() => setSelectedDebt(debt)}
                      >
                        <CreditCard className="size-4" />
                        Payer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {paginatedDebts.items.length === 0 && (
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
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <DebtPaymentDialog
        debt={selectedDebt}
        redirectTo={redirectTo}
        onOpenChange={(open) => {
          if (!open) setSelectedDebt(null)
        }}
      />
    </main>
  )
}

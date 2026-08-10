import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { ArrowLeft, CalendarDays, Search } from 'lucide-react'
import { useState } from 'react'
import { DataLoader } from '~/components/common/data_loader'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { CashSessionCard } from '~/components/sales/cash_session_card'
import { Button } from '~/components/ui/button'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { PeriodSelector } from '~/components/ui/period_selector'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { usePaginated } from '~/hooks/use_paginated'
import { useSelectionDate } from '~/hooks/use_selection_date'
import type { InertiaProps } from '~/types'
import type { CashSessionItem } from '~/types/cash_session_types'
import type { CashSessionsPageProps } from '~/types/cash_session_types'

const CASH_SESSIONS_PAGE_SIZE = 20

export default function CashSessionsPage({
  sessions,
  filters,
}: InertiaProps<CashSessionsPageProps>) {
  // Hooks pour gérer la sélection de dates et la pagination des sessions.
  const selectionDate = useSelectionDate({
    initialStartDate: filters.startDate,
    initialEndDate: filters.endDate,
  })

  // State pour gérer le chargement.
  const [isLoading, setIsLoading] = useState(false)

  // Hook pour gérer la pagination des sessions de caisse.
  const paginatedSessions = usePaginated<CashSessionItem>({
    initialItems: sessions,
    pageSize: CASH_SESSIONS_PAGE_SIZE,
  })

  // Fonction pour rechercher les sessions de caisse en fonction des dates sélectionnées.
  const searchSessions = () => {
    setIsLoading(true)
    router.get(
      '/sales/sessions',
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
          title="Sessions de caisse"
          description="Consulter les rapports de caisse par période."
          icon={CalendarDays}
          accentClassName={MODULE_HEADER_ACCENTS.sales}
        >
          <PeriodSelector
            startDate={selectionDate.startDate}
            endDate={selectionDate.endDate}
            onDateChange={selectionDate.handleDateChange}
            onSearch={searchSessions}
            isLoading={isLoading}
            className="w-full lg:w-auto"
            hideCardWrapper
          />
          <Button render={<Link href="/sales" />} variant="outline">
            <ArrowLeft className="size-4" />
            Ventes
          </Button>
        </PageHeader>

        {isLoading ? (
          <DataLoader title="Chargement des sessions..." />
        ) : paginatedSessions.items.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucune session trouvée"
            description="Aucune session de caisse ne correspond à cette période."
          />
        ) : (
          <>
            {paginatedSessions.totalLoadedPages > 1 && (
              <PaginationControls
                canGoPrevious={paginatedSessions.canGoPrevious}
                canGoNext={paginatedSessions.canGoNext}
                pageSize={CASH_SESSIONS_PAGE_SIZE}
                onPrevious={paginatedSessions.goToPreviousPage}
                onNext={paginatedSessions.goToNextPage}
              />
            )}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {paginatedSessions.visibleItems.map((session) => (
                <CashSessionCard
                  key={session.id}
                  session={session}
                  onSelect={() => router.get(`/sales/sessions/${session.id}`)}
                />
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

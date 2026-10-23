import { AppLink as Link } from '~/components/common/app_link'
import { ArrowLeft, CalendarDays, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useCrud } from '~/hooks/common/useCrud'
import type { CashSessionItem } from '~/types/cash_session_types'

const CASH_SESSIONS_PAGE_SIZE = 20

const EMPTY_SESSIONS: CashSessionItem[] = []

export default function CashSessionsPage() {
  const navigate = useNavigate()
  const selectionDate = useSelectionDate()
  // Sans filtre au premier chargement ; la période n'est envoyée qu'au clic sur "Chercher"
  const [appliedPeriod, setAppliedPeriod] = useState<{ startDate?: string; endDate?: string }>({})
  const { data, isFetching: isLoading } = useCrud<CashSessionItem>({
    endpoint: '/cash-sessions',
  }).useListWithParams(appliedPeriod)
  const sessions = data ?? EMPTY_SESSIONS

  // Hook pour gérer la pagination des sessions de caisse.
  const paginatedSessions = usePaginated<CashSessionItem>({
    initialItems: sessions,
    pageSize: CASH_SESSIONS_PAGE_SIZE,
  })

  // Fonction pour rechercher les sessions de caisse en fonction des dates sélectionnées.
  const searchSessions = () => {
    setAppliedPeriod({ startDate: selectionDate.startDate, endDate: selectionDate.endDate })
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
                  onSelect={() => navigate(`/sales/sessions/${session.id}`)}
                />
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

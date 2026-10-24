import { History } from 'lucide-react'
import { useState } from 'react'
import { DataLoader } from '~/components/common/data_loader'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { PeriodSelector } from '~/components/ui/period_selector'
import { OptionSelect } from '~/components/common/option_select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  JOURNALISATION_MODULE_LABELS,
  JOURNALISATION_MODULE_OPTIONS,
} from '~/constants/journalisations'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { useServerBatchPagination } from '~/hooks/use_server_batch_pagination'
import { useSelectionDate } from '~/hooks/use_selection_date'
import { ManagementLayout } from '~/layouts/management_layout'
import type {
  JournalisationListItem,
  JournalisationModuleFilter,
} from '~/types/journalisation_types'
import { formatLongDate, formatShortTime } from '~/utils/date'

// Un lot du serveur alimente cinq pages affichées.
const JOURNALISATIONS_PAGE_SIZE = 10
const JOURNALISATIONS_BATCH_SIZE = 50

export default function JournalisationsPage() {
  // Hooks d'état local pour les filtres.
  const selectionDate = useSelectionDate()
  const [module, setModule] = useState<JournalisationModuleFilter>('ALL')
  // Sans filtre de dates au premier chargement ; les filtres partent au clic sur "Chercher".
  const [appliedFilters, setAppliedFilters] = useState<{
    module: string
    startDate?: string
    endDate?: string
  }>({ module: 'ALL' })

  // Le serveur renvoie le journal par lots ; chaque lot alimente plusieurs pages
  const journalisations = useServerBatchPagination<JournalisationListItem>({
    endpoint: '/journalisations',
    params: appliedFilters,
    itemsPerPage: JOURNALISATIONS_PAGE_SIZE,
    batchSize: JOURNALISATIONS_BATCH_SIZE,
  })
  const { isLoading, isFetching } = journalisations

  // Applique les filtres côté serveur et repart du premier lot.
  const searchJournalisations = () => {
    setAppliedFilters({
      module,
      startDate: selectionDate.startDate,
      endDate: selectionDate.endDate,
    })
  }

  return (
    <ManagementLayout title="Journalisation">
      <section className="flex flex-col gap-6">
        <PageHeader
          title="Journalisation"
          description={`Les actions sont affichées par page de ${JOURNALISATIONS_PAGE_SIZE}.`}
          icon={History}
          accentClassName={MODULE_HEADER_ACCENTS.management}
        />

        <Card className="bg-background">
          <CardHeader className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Filtrer les actions par module et période.</CardDescription>
            </div>

            <div className="flex w-full flex-col gap-4 xl:w-auto xl:flex-row xl:items-end xl:justify-end">
              <div className="grid gap-2 xl:w-56">
                <label className="text-sm font-medium" htmlFor="journalisation-module">
                  Module
                </label>
                <OptionSelect
                  id="journalisation-module"
                  options={JOURNALISATION_MODULE_OPTIONS}
                  value={module}
                  onValueChange={(value) => setModule(value as JournalisationModuleFilter)}
                />
              </div>

              <PeriodSelector
                startDate={selectionDate.startDate}
                endDate={selectionDate.endDate}
                onDateChange={selectionDate.handleDateChange}
                onSearch={searchJournalisations}
                isLoading={isFetching}
                className="xl:w-auto"
                hideCardWrapper
              />
            </div>
          </CardHeader>
        </Card>

        {isLoading ? (
          <DataLoader title="Chargement des journalisations..." />
        ) : (
          <Card className={`bg-background transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-muted">
                  <History className="size-5" />
                </span>
                <div>
                  <CardTitle>Actions enregistrées</CardTitle>
                  <CardDescription>
                    Page {journalisations.currentPage} sur {journalisations.totalPages} -{' '}
                    {journalisations.totalItems} entrée(s)
                  </CardDescription>
                </div>
              </div>

              <PaginationControls
                currentPage={journalisations.currentPage}
                totalPages={journalisations.totalPages}
                onPageChange={journalisations.goToPage}
                className=""
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalisations.currentItems.map((journalisation) => {
                    const createdAt = new Date(journalisation.createdAt)

                    return (
                      <TableRow key={journalisation.id}>
                        <TableCell>
                          <div className="grid gap-1">
                            <span>{formatLongDate(createdAt)}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatShortTime(createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {JOURNALISATION_MODULE_LABELS[journalisation.module]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {journalisation.user ? (
                            <span>{journalisation.user.fullName ?? 'Utilisateur sans nom'}</span>
                          ) : (
                            <span className="text-muted-foreground">Système</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xl whitespace-normal">
                          {journalisation.message}
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {journalisations.currentItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64">
                        <EmptyState
                          icon={History}
                          title="Aucune entrée trouvée"
                          description="Aucune action n'a été enregistrée pour cette période ou ces critères."
                          className="border-none bg-transparent shadow-none"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </ManagementLayout>
  )
}

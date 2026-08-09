import { router } from '@inertiajs/react'
import { History } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { PeriodSelector } from '~/components/ui/period_selector'
import { PageHeader } from '~/components/common/page_header'
import { EmptyState } from '~/components/common/empty_state'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
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
import { usePaginated } from '~/hooks/use_paginated'
import { useSelectionDate } from '~/hooks/use_selection_date'
import { ManagementLayout } from '~/layouts/management_layout'
import { formatLongDate, formatShortTime } from '~/utils/date'
import type {
  JournalisationListItem,
  JournalisationModuleFilter,
  JournalisationsPageProps,
} from '~/types/journalisation_types'

const JOURNALISATIONS_PAGE_SIZE = 10

export default function JournalisationsPage({
  journalisations,
  filters,
}: JournalisationsPageProps) {
  // Hooks d'état local pour les filtres.
  const selectionDate = useSelectionDate({
    initialStartDate: filters.startDate,
    initialEndDate: filters.endDate,
  })

  // Hooks d'état local pour le module et le chargement.
  const [module, setModule] = useState<JournalisationModuleFilter>(filters.module)
  const [isLoading, setIsLoading] = useState(false)

  // Hook de pagination pour gérer les entrées visibles et la navigation.
  const paginatedJournalisations = usePaginated<JournalisationListItem>({
    initialItems: journalisations,
    pageSize: JOURNALISATIONS_PAGE_SIZE,
  })

  // Applique les filtres via Inertia; la pagination reste ensuite locale.
  const searchJournalisations = () => {
    setIsLoading(true)

    router.get(
      '/management/journalisations',
      {
        module,
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
    <ManagementLayout title="Journalisation">
      <section className="flex flex-col gap-6">
        <PageHeader
          title="Journalisation"
          description={`Les actions chargées sont affichées par page de ${JOURNALISATIONS_PAGE_SIZE}.`}
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
                <Select
                  items={JOURNALISATION_MODULE_OPTIONS}
                  value={module}
                  onValueChange={(value) => setModule(value as JournalisationModuleFilter)}
                >
                  <SelectTrigger id="journalisation-module" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOURNALISATION_MODULE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <PeriodSelector
                startDate={selectionDate.startDate}
                endDate={selectionDate.endDate}
                onDateChange={selectionDate.handleDateChange}
                onSearch={searchJournalisations}
                isLoading={isLoading}
                className="xl:w-auto"
                hideCardWrapper
              />
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted">
                <History className="size-5" />
              </span>
              <div>
                <CardTitle>Actions enregistrées</CardTitle>
                <CardDescription>
                  Page {paginatedJournalisations.currentPage} -{' '}
                  {paginatedJournalisations.loadedItemsCount} entrée(s) chargée(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PaginationControls
              canGoPrevious={paginatedJournalisations.canGoPrevious}
              canGoNext={paginatedJournalisations.canGoNext}
              pageSize={JOURNALISATIONS_PAGE_SIZE}
              onPrevious={paginatedJournalisations.goToPreviousPage}
              onNext={paginatedJournalisations.goToNextPage}
            />
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
                {paginatedJournalisations.visibleItems.map((journalisation) => {
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

                {paginatedJournalisations.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64">
                      <EmptyState
                        icon={History}
                        title="Aucune entrée trouvée"
                        description="Aucune action n'a été enregistrée pour cette période ou ces critères."
                        className="border-none shadow-none bg-transparent"
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </ManagementLayout>
  )
}

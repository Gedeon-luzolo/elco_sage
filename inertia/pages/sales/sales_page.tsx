import { Link } from '@adonisjs/inertia/react'
import {
  Banknote,
  CalendarDays,
  CreditCard,
  Eye,
  HandCoins,
  Plus,
  ShoppingCart,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { SearchInput } from '~/components/common/search_input'
import { SaleDetailPanel } from '~/components/sales/sale_detail_panel'
import { SalesTable } from '~/components/sales/sales_table'
import { ThermalSaleReceipt } from '~/components/sales/thermal_sale_receipt'
import { Button } from '~/components/ui/button'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { usePaginated } from '~/hooks/use_paginated'
import { usePrintInvoice } from '~/hooks/use_print_invoice'
import { useSearch } from '~/hooks/use_search'
import type { InertiaProps } from '~/types'
import type { SalesPageProps } from '~/types/cash_session_types'
import { formatDateLabel } from '~/utils/date'
import { saleSearchFields } from '~/utils/sales/sale.utils'

const SALES_PAGE_SIZE = 2

export default function SalesPage({ currentCashSession, sales }: InertiaProps<SalesPageProps>) {
  const printSaleId = new URLSearchParams(window.location.search).get('printSaleId')
  // La vente selectionnee est identifiee par son ID. On initialise la selection a printSaleId si present, sinon a la premiere vente chargee.²
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(
    printSaleId ?? sales[0]?.id ?? null
  )

  // Filtre les ventes de la session courante par addition, client ou bon de commande.
  const {
    search,
    setSearch,
    filteredItems: filteredSales,
  } = useSearch({
    items: sales,
    fields: saleSearchFields,
  })

  // Pagine localement les ventes deja chargees apres application de la recherche.
  const paginatedSales = usePaginated({
    initialItems: filteredSales,
    pageSize: SALES_PAGE_SIZE,
  })

  // La description de la page depend de l'etat de la session courante.
  const pageDescription = currentCashSession?.openingDate
    ? `Session ouverte le ${formatDateLabel(currentCashSession.openingDate)} a ${
        currentCashSession.openingTime ?? '--:--'
      }.`
    : 'Lecture des ventes enregistrees dans la session de caisse courante.'

  const effectiveSelectedSaleId = paginatedSales.visibleItems.some(
    (sale) => sale.id === selectedSaleId
  )
    ? selectedSaleId
    : (paginatedSales.visibleItems[0]?.id ?? null)

  // La ligne selectionnee alimente le panneau de details.
  const selectedSale = useMemo(
    () => sales.find((sale) => sale.id === effectiveSelectedSaleId) ?? null,
    [sales, effectiveSelectedSaleId]
  )
  // Le callback pour selectionner une vente a ete memorise pour eviter de recrer la fonction a chaque rendu.
  const selectSaleForPrint = useCallback((saleId: string) => setSelectedSaleId(saleId), [])

  // Utiliser le hook usePrintInvoice pour preparer l'impression du ticket thermique.
  const { printInvoice, receiptRef } = usePrintInvoice({
    selectedSale,
    onSelectSale: selectSaleForPrint,
  })

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <div className="fixed left-[10000px] top-0" aria-hidden="true">
        {/* Le ticket reste monte hors ecran pour que react-to-print puisse le lire via ref. */}
        <div ref={receiptRef} className="bg-white">
          {selectedSale && <ThermalSaleReceipt sale={selectedSale} />}
        </div>
      </div>

      <section className="flex w-full flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader
          title="Gestion des ventes"
          description={pageDescription}
          icon={ShoppingCart}
          accentClassName={MODULE_HEADER_ACCENTS.sales}
        >
          <>
            <Button
              render={<Link href="/sales/sessions" />}
              variant="outline"
              className="bg-sky-600 text-white hover:bg-sky-500/80 hover:text-white"
            >
              <CalendarDays className="size-4" />
              Rapport des Sessions
            </Button>
            <Button
              className="bg-red-800 text-white hover:bg-red-500/80 hover:text-white"
              render={<Link href="/sales/debts" />}
              variant="outline"
            >
              <CreditCard className="size-4" />
              Credits
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-500/80 hover:text-white"
              render={<Link href="/sales/recoveries" />}
              variant="outline"
            >
              <HandCoins className="size-4" />
              Recouvrements
            </Button>

            {currentCashSession ? (
              <Button render={<Link href="/sales/create" />}>
                <Plus className="size-4" />
                Nouvelle vente
              </Button>
            ) : (
              <Button render={<Link href="/sales/session/open" />} variant="outline">
                <Banknote className="size-4" />
                Ouvrir une caisse
              </Button>
            )}
          </>
        </PageHeader>

        {!currentCashSession ? (
          <EmptyState
            icon={Banknote}
            title="Aucune caisse ouverte"
            description="Ouvrez une session de caisse pour consulter les ventes de votre session."
          />
        ) : sales.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="Aucune vente dans cette session"
            description="Les ventes enregistrees pendant cette session apparaitront ici."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher addition, client ou bon..."
                className="w-full lg:w-80"
              />

              {paginatedSales.totalLoadedPages > 1 && (
                <PaginationControls
                  canGoPrevious={paginatedSales.canGoPrevious}
                  canGoNext={paginatedSales.canGoNext}
                  pageSize={SALES_PAGE_SIZE}
                  onPrevious={paginatedSales.goToPreviousPage}
                  onNext={paginatedSales.goToNextPage}
                />
              )}
            </div>

            <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(540px,620px)]">
              <SalesTable
                sales={paginatedSales.visibleItems}
                selectedSaleId={effectiveSelectedSaleId}
                onSelectSale={setSelectedSaleId}
              />
              {selectedSale && <SaleDetailPanel sale={selectedSale} onPrintSale={printInvoice} />}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

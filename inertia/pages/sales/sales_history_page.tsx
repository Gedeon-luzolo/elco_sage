import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { todayDateKey } from '#utils/date_utils'
import { ArrowLeft, History, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { DataLoader } from '~/components/common/data_loader'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { SaleDetailPanel } from '~/components/sales/sale_detail_panel'
import { SalesTable } from '~/components/sales/sales_table'
import { ThermalSaleReceipt } from '~/components/sales/thermal_sale_receipt'
import { Button } from '~/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PaginationControls } from '~/components/ui/pagination_controls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { usePaginated } from '~/hooks/use_paginated'
import { usePrintInvoice } from '~/hooks/use_print_invoice'
import type { SalesHistoryPageProps } from '~/types/sale_types'

const SALES_HISTORY_PAGE_SIZE = 20

// Options du filtre de statut, alignees sur l'enum backend SaleStatus.
const SALE_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'ACTIVE', label: 'Actives' },
  { value: 'CANCELLED', label: 'Annulées' },
] as const

export default function SalesHistoryPage({ sales, filters }: SalesHistoryPageProps) {
  const [additionNumber, setAdditionNumber] = useState(filters.additionNumber ?? '')
  const [status, setStatus] = useState(filters.status ?? 'ALL')
  const [facturationDate, setFacturationDate] = useState(filters.facturationDate ?? '')
  const [isLoading, setIsLoading] = useState(false)

  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(sales[0]?.id ?? null)

  // Pagine en memoire le batch deja charge depuis le serveur.
  const paginatedSales = usePaginated({
    initialItems: sales,
    pageSize: SALES_HISTORY_PAGE_SIZE,
  })

  const effectiveSelectedSaleId = paginatedSales.visibleItems.some(
    (sale) => sale.id === selectedSaleId
  )
    ? selectedSaleId
    : (paginatedSales.visibleItems[0]?.id ?? null)

  const selectedSale = useMemo(
    () => sales.find((sale) => sale.id === effectiveSelectedSaleId) ?? null,
    [sales, effectiveSelectedSaleId]
  )
  const selectSaleForPrint = useCallback((saleId: string) => setSelectedSaleId(saleId), [])

  const { printInvoice, receiptRef } = usePrintInvoice({
    selectedSale,
    onSelectSale: selectSaleForPrint,
  })

  // Recharge un nouveau batch depuis le serveur avec les filtres courants.
  const searchSalesHistory = () => {
    setIsLoading(true)

    router.get(
      '/sales/history',
      {
        facturationDate: facturationDate || undefined,
        additionNumber: additionNumber || undefined,
        status,
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
      <div className="fixed left-[10000px] top-0" aria-hidden="true">
        {/* Le ticket reste monte hors ecran pour que react-to-print puisse le lire via ref. */}
        <div ref={receiptRef} className="bg-white">
          {selectedSale && <ThermalSaleReceipt sale={selectedSale} />}
        </div>
      </div>

      <section className="flex w-full flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader
          title="Historique des ventes"
          description="Retrouvez une addition passee, toutes caisses et journees confondues, pour la reimprimer."
          icon={History}
          accentClassName={MODULE_HEADER_ACCENTS.sales}
        >
          <Button render={<Link href="/sales" />} variant="outline">
            <ArrowLeft className="size-4" />
            Retour aux ventes
          </Button>
        </PageHeader>

        <Card className="bg-background">
          <CardHeader className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>
                Chercher par numero d'addition, statut et/ou periode de facturation.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-4 xl:w-auto xl:flex-row xl:items-end xl:justify-end">
              <div className="grid gap-2 xl:w-56">
                <Label htmlFor="addition-number">Numero d'addition</Label>
                <Input
                  id="addition-number"
                  className="h-10"
                  placeholder="Ex: 000123"
                  value={additionNumber}
                  onChange={(event) => setAdditionNumber(event.target.value)}
                />
              </div>

              <div className="grid gap-2 xl:w-44">
                <Label htmlFor="sale-status">Statut</Label>
                <Select value={status} onValueChange={(value) => setStatus(value ?? 'ALL')}>
                  <SelectTrigger id="sale-status" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 xl:w-44">
                <Label htmlFor="facturation-date">Date de facturation</Label>
                <Input
                  id="facturation-date"
                  type="date"
                  className="h-10"
                  value={facturationDate}
                  max={todayDateKey()}
                  onChange={(event) => setFacturationDate(event.target.value)}
                />
              </div>

              <Button
                variant="outline"
                type="button"
                size="lg"
                disabled={isLoading}
                onClick={searchSalesHistory}
              >
                <Search className="size-4" />
                {isLoading ? 'Chargement...' : 'Chercher'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {isLoading ? (
          <DataLoader title="Chargement de l'historique..." />
        ) : sales.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucune vente trouvee"
            description="Modifiez la periode ou le numero d'addition recherche."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {paginatedSales.totalLoadedPages > 1 && (
              <PaginationControls
                canGoPrevious={paginatedSales.canGoPrevious}
                canGoNext={paginatedSales.canGoNext}
                pageSize={SALES_HISTORY_PAGE_SIZE}
                onPrevious={paginatedSales.goToPreviousPage}
                onNext={paginatedSales.goToNextPage}
              />
            )}

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

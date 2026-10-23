import { AppLink as Link } from '~/components/common/app_link'
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
import { ConfirmationDialog } from '~/components/ui/confirmation_dialog'
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
import { useAuth } from '~/hooks/auth/useAuth'
import { useCrud } from '~/hooks/common/useCrud'
import type { SaleItemRow } from '~/types/sale_types'
import { getLocalDateKey } from '~/utils/date'
import { isManagementRole } from '~/utils/user_role.utils'

const SALES_HISTORY_PAGE_SIZE = 20

// Options du filtre de statut, alignees sur l'enum backend SaleStatus.
const SALE_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'ACTIVE', label: 'Actives' },
  { value: 'CANCELLED', label: 'Annulées' },
] as const

const EMPTY_SALES: SaleItemRow[] = []

export default function SalesHistoryPage() {
  const { user } = useAuth()
  const isManagementUser = isManagementRole(user?.role)
  const [additionNumber, setAdditionNumber] = useState('')
  const [status, setStatus] = useState('ALL')
  const [facturationDate, setFacturationDate] = useState('')
  // Les filtres ne sont envoyes au serveur qu'au clic sur "Chercher".
  const [appliedFilters, setAppliedFilters] = useState<{
    facturationDate?: string
    additionNumber?: string
    status: string
  }>({ status: 'ALL' })

  const { useListWithParams, useAction } = useCrud<SaleItemRow>({
    endpoint: '/sales',
    showSuccessToast: false,
    invalidateQueries: ['/cash-sessions', '/product-services', '/stock', '/debts', '/recoveries'],
  })
  const { data, isFetching: isLoading } = useListWithParams(appliedFilters)
  const sales = data ?? EMPTY_SALES
  const cancelSale = useAction<string>({
    method: 'patch',
    path: (saleId) => `/sales/${saleId}/cancel`,
    successMessage: 'Vente annulée avec succès.',
  })
  const [saleToCancel, setSaleToCancel] = useState<SaleItemRow | null>(null)

  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(sales[0]?.id ?? null)

  // Pagine en mémoire le lot déjà chargé depuis le serveur.
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

  // Confirme l'annulation d'une vente par un profil de gestion.
  const confirmCancelSale = () => {
    if (!saleToCancel) return

    cancelSale.mutate(saleToCancel.id, { onSuccess: () => setSaleToCancel(null) })
  }

  // Recharge un nouveau lot depuis le serveur avec les filtres courants.
  const searchSalesHistory = () => {
    setAppliedFilters({
      facturationDate: facturationDate || undefined,
      additionNumber: additionNumber || undefined,
      status,
    })
  }

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <div className="fixed left-[10000px] top-0" aria-hidden="true">
        {/* Le ticket reste monté hors écran pour que react-to-print puisse le lire via ref. */}
        <div ref={receiptRef} className="bg-white">
          {selectedSale && <ThermalSaleReceipt sale={selectedSale} />}
        </div>
      </div>

      <section className="flex w-full flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader
          title="Historique des ventes"
          description="Retrouvez une addition passée, toutes caisses et journées confondues, pour la réimprimer."
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
                Chercher par numéro d&apos;addition, statut et/ou date de facturation.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-4 xl:w-auto xl:flex-row xl:items-end xl:justify-end">
              <div className="grid gap-2 xl:w-56">
                <Label htmlFor="addition-number">Numéro d&apos;addition</Label>
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
                  max={getLocalDateKey()}
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
            title="Aucune vente trouvée"
            description="Modifiez la date, le statut ou le numéro d'addition recherché."
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
              {selectedSale && (
                <SaleDetailPanel
                  sale={selectedSale}
                  canCancelSale={isManagementUser && selectedSale.cashSessionStatus !== 'CLOSED'}
                  onPrintSale={printInvoice}
                  onCancelSale={setSaleToCancel}
                />
              )}
            </div>
          </div>
        )}
      </section>

      <ConfirmationDialog
        open={Boolean(saleToCancel)}
        title="Annuler cette vente ?"
        description={`L'addition ${saleToCancel?.additionNumber ?? ''} sera annulée et les sorties de stock associées seront restaurées.`}
        confirmLabel="Annuler la vente"
        variant="destructive"
        onOpenChange={(open) => {
          if (!open) setSaleToCancel(null)
        }}
        onCancel={() => setSaleToCancel(null)}
        onConfirm={confirmCancelSale}
      />
    </main>
  )
}

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
import { OptionSelect } from '~/components/common/option_select'
import { ConfirmationDialog } from '~/components/ui/confirmation_dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { SALES_HISTORY_BATCH_SIZE, SALES_HISTORY_PAGE_SIZE } from '~/constants/sales'
import { useServerBatchPagination } from '~/hooks/use_server_batch_pagination'
import { usePrintInvoice } from '~/hooks/use_print_invoice'
import { useOutbox } from '~/hooks/useOutbox'
import { getPendingSales } from '~/lib/offline/pending_sales'
import { useAuth } from '~/hooks/auth/useAuth'
import { useCrud } from '~/hooks/common/useCrud'
import type { SaleItemRow } from '~/types/sale_types'
import { todayDateKey } from '~/utils/date'
import { isManagementRole } from '~/utils/user_role.utils'

// Options du filtre de statut, alignees sur l'enum backend SaleStatus.
const SALE_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'ACTIVE', label: 'Actives' },
  { value: 'CANCELLED', label: 'Annulées' },
] as const

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

  const { useAction } = useCrud<SaleItemRow>({
    endpoint: '/sales',
    showSuccessToast: false,
    invalidateQueries: ['/cash-sessions', '/debts', '/recoveries'],
  })

  // Le serveur renvoie l'historique par lots ; chaque lot alimente plusieurs pages
  const {
    currentItems: serverSales,
    currentPage,
    totalPages,
    isLoading,
    isFetching,
    goToPage,
  } = useServerBatchPagination<SaleItemRow>({
    endpoint: '/sales',
    params: appliedFilters,
    itemsPerPage: SALES_HISTORY_PAGE_SIZE,
    batchSize: SALES_HISTORY_BATCH_SIZE,
  })

  // Les ventes faites hors ligne s'affichent avec celles du serveur, selon les mêmes filtres
  const outbox = useOutbox()
  const pendingSales = useMemo(
    () => getPendingSales(outbox, user?.id ?? '', appliedFilters),
    [outbox, user?.id, appliedFilters]
  )
  const pendingSaleIds = useMemo(() => new Set(pendingSales.map((sale) => sale.id)), [pendingSales])

  // Les ventes en attente s'affichent en tête de la première page
  const visibleSales = useMemo(
    () => (currentPage === 1 ? [...pendingSales, ...serverSales] : serverSales),
    [currentPage, pendingSales, serverSales]
  )
  const cancelSale = useAction<string>({
    method: 'patch',
    path: (saleId) => `/sales/${saleId}/cancel`,
    successMessage: 'Vente annulée avec succès.',
  })
  const [saleToCancel, setSaleToCancel] = useState<SaleItemRow | null>(null)

  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

  const effectiveSelectedSaleId = visibleSales.some((sale) => sale.id === selectedSaleId)
    ? selectedSaleId
    : (visibleSales[0]?.id ?? null)

  const selectedSale = useMemo(
    () => visibleSales.find((sale) => sale.id === effectiveSelectedSaleId) ?? null,
    [visibleSales, effectiveSelectedSaleId]
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
                <OptionSelect
                  id="sale-status"
                  options={SALE_STATUS_OPTIONS}
                  value={status}
                  onValueChange={setStatus}
                />
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
                disabled={isFetching}
                onClick={searchSalesHistory}
              >
                <Search className="size-4" />
                {isFetching ? 'Chargement...' : 'Chercher'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {isLoading ? (
          <DataLoader title="Chargement de l'historique..." />
        ) : visibleSales.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucune vente trouvée"
            description="Modifiez la date, le statut ou le numéro d'addition recherché."
          />
        ) : (
          <div
            className={`flex flex-col gap-4 transition-opacity ${isFetching ? 'opacity-60' : ''}`}
          >
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                className="justify-end"
              />
            )}

            <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(540px,620px)]">
              <SalesTable
                sales={visibleSales}
                selectedSaleId={effectiveSelectedSaleId}
                onSelectSale={setSelectedSaleId}
                pendingSaleIds={pendingSaleIds}
              />
              {selectedSale && (
                <SaleDetailPanel
                  sale={selectedSale}
                  isPending={pendingSaleIds.has(selectedSale.id)}
                  canCancelSale={
                    isManagementUser &&
                    selectedSale.cashSessionStatus !== 'CLOSED' &&
                    !pendingSaleIds.has(selectedSale.id)
                  }
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
        description={`L'addition ${saleToCancel?.additionNumber ?? ''} sera annulée.`}
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

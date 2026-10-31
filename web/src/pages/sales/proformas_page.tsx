import { ArrowLeft, FileText, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppLink as Link } from '~/components/common/app_link'
import { DataLoader } from '~/components/common/data_loader'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { SearchInput } from '~/components/common/search_input'
import { InvoicePaperPreview } from '~/components/invoices/invoice_paper_preview'
import { ProformaActions } from '~/components/proformas/proforma_actions'
import { ProformasGalleryView } from '~/components/proformas/proformas_gallery_view'
import { Button } from '~/components/ui/button'
import { ConfirmationDialog } from '~/components/ui/confirmation_dialog'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { useCrud } from '~/hooks/common/useCrud'
import { useCurrentCashSession } from '~/hooks/sales/useCashSession'
import { useServerBatchPagination } from '~/hooks/use_server_batch_pagination'
import type { ProformaRow } from '~/types/proforma_types'
import { proformaToInvoice } from '~/utils/invoices/invoice.utils'
import { formatProformaNumber, PROFORMA_STATUS_OPTIONS } from '~/utils/sales/proforma.utils'

// 12 proformas par page ; un lot du serveur en couvre trois.
const PROFORMAS_PAGE_SIZE = 12
const PROFORMAS_BATCH_SIZE = 36

// Délai avant d'envoyer la recherche, pour ne pas interroger le serveur à chaque touche.
const SEARCH_DELAY_MS = 300

export default function ProformasPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: currentCashSession } = useCurrentCashSession()

  const [status, setStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  // La recherche part une fois la saisie terminée
  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedSearch(search.trim()), SEARCH_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [search])

  const {
    currentItems: proformas,
    currentPage,
    totalPages,
    isLoading,
    isFetching,
    goToPage,
  } = useServerBatchPagination<ProformaRow>({
    endpoint: '/proformas',
    params: {
      search: appliedSearch || undefined,
      status: status === 'ALL' ? undefined : status,
    },
    itemsPerPage: PROFORMAS_PAGE_SIZE,
    batchSize: PROFORMAS_BATCH_SIZE,
  })

  const { useAction } = useCrud<ProformaRow>({
    endpoint: '/proformas',
    showSuccessToast: false,
  })
  const cancelProforma = useAction<string>({
    method: 'patch',
    path: (proformaId) => `/proformas/${proformaId}/cancel`,
    successMessage: 'Proforma annulée.',
  })
  const [proformaToCancel, setProformaToCancel] = useState<ProformaRow | null>(null)

  // Rien n'est ouvert par défaut, sauf la proforma qu'on vient d'enregistrer
  const [selectedId, setSelectedId] = useState<string | null>(
    (location.state as { selectedProformaId?: string } | null)?.selectedProformaId ?? null
  )

  // Un clic sur le bon ouvert le referme
  const toggleSelection = (proforma: ProformaRow) => {
    setSelectedId((current) => (current === proforma.id ? null : proforma.id))
  }

  // Le détail vient de la liste : elle est rechargée après une annulation ou une conversion
  const selected = proformas.find((item) => item.id === selectedId) ?? null

  const confirmCancelProforma = () => {
    if (!proformaToCancel) return

    cancelProforma.mutate(proformaToCancel.id, { onSuccess: () => setProformaToCancel(null) })
  }

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      {/* Un clic hors d'un bon et hors du détail referme le détail : les bons reprennent la place */}
      <section
        className="flex w-full flex-col gap-6 px-6 py-8 lg:px-10"
        onClick={() => setSelectedId(null)}
      >
        <PageHeader
          title="Factures proforma"
          description="Les devis remis aux clients, prêts à télécharger ou à convertir en vente."
          icon={FileText}
          accentClassName={MODULE_HEADER_ACCENTS.sales}
        >
          <Button render={<Link href="/sales" />} variant="outline">
            <ArrowLeft className="size-4" />
            Retour aux ventes
          </Button>
          <Button render={<Link href="/sales/proformas/create" />}>
            <Plus className="size-4" />
            Nouvelle proforma
          </Button>
        </PageHeader>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Tabs value={status} onValueChange={(value) => setStatus(String(value))}>
            <TabsList>
              {PROFORMA_STATUS_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Numéro ou client..."
            className="md:ml-auto md:max-w-xs"
          />
        </div>

        {isLoading ? (
          <DataLoader title="Chargement des proformas..." />
        ) : proformas.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune proforma"
            description="Créez une proforma ou changez de statut ou de recherche."
          />
        ) : (
          <div
            className={
              selected
                ? 'grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(480px,560px)]'
                : 'w-full'
            }
          >
            <div
              className={`flex min-w-0 flex-col gap-4 transition-opacity ${isFetching ? 'opacity-60' : ''}`}
            >
              <ProformasGalleryView
                proformas={proformas}
                selectedId={selectedId}
                expanded={!selected}
                onSelect={toggleSelection}
              />

              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  className="justify-center"
                />
              )}
            </div>

            {/* À droite, la feuille elle-même, avec ses actions au-dessus */}
            {selected && (
              <aside
                className="flex flex-col gap-3 lg:sticky lg:top-4"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ProformaActions
                    proforma={selected}
                    canConvert={Boolean(currentCashSession)}
                    onEdit={(proforma) =>
                      navigate(`/sales/proformas/${proforma.id}/edit`, { state: { proforma } })
                    }
                    // La vente se fait sur le formulaire de caisse, prérempli avec la proforma
                    onConvert={(proforma) => navigate('/sales/create', { state: { proforma } })}
                    onCancel={setProformaToCancel}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto"
                    aria-label="Fermer le détail"
                    title="Fermer"
                    onClick={() => setSelectedId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <InvoicePaperPreview invoice={proformaToInvoice(selected)} />
              </aside>
            )}
          </div>
        )}
      </section>

      <ConfirmationDialog
        open={Boolean(proformaToCancel)}
        title="Annuler cette proforma ?"
        description={`La proforma N°${proformaToCancel ? formatProformaNumber(proformaToCancel) : ''} sera annulée et ne pourra plus être convertie.`}
        confirmLabel="Annuler la proforma"
        variant="destructive"
        processing={cancelProforma.isPending}
        onOpenChange={(open) => {
          if (!open) setProformaToCancel(null)
        }}
        onCancel={() => setProformaToCancel(null)}
        onConfirm={confirmCancelProforma}
      />
    </main>
  )
}

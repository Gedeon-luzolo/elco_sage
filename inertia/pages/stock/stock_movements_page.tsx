import { router } from '@inertiajs/react'
import { ArrowLeft, Package, Warehouse } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { SearchInput } from '~/components/common/search_input'
import { StockDetailPanel } from '~/components/stock/stock_detail_panel'
import type { InventoryPageProps } from '~/types/stock_types'
import { Input } from '~/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { useSearch } from '~/hooks/use_search'
import { StockEntryDialog } from '~/components/stock/stock_entry_dialog'
import { StockPhysicalDialog } from '~/components/stock/stock_physical_dialog'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { formatQuantity } from '~/utils/stock'
import { getLocalDateKey } from '~/utils/date'

/**
 * Page principale de gestion des mouvements de stock journaliers.
 * Permet de visualiser, enregistrer les entrées et valider les stocks physiques.
 */
export default function StockMovementsPage({ stockItems, currentDate }: InventoryPageProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate)
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null)
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [physicalDialogOpen, setPhysicalDialogOpen] = useState(false)
  const todayKey = getLocalDateKey()
  const {
    search: searchTerm,
    setSearch: setSearchTerm,
    filteredItems,
  } = useSearch({
    items: stockItems,
    fields: ['productName'],
  })

  // Trouver le mouvement sélectionné
  const selectedMovement = selectedMovementId
    ? filteredItems.find((item) => item.productId === selectedMovementId) || null
    : null

  // Ouvrir le dialog d'entrée
  const openEntryDialog = () => {
    setEntryDialogOpen(true)
  }

  const openPhysicalDialog = () => {
    setPhysicalDialogOpen(true)
  }

  // Charger les données pour la date sélectionnée
  const changeSelectedDate = (date: string) => {
    setSelectedDate(date)
    setSelectedMovementId(null)
    setEntryDialogOpen(false)
    setPhysicalDialogOpen(false)
    router.get('/stock', { date }, { preserveState: false, preserveScroll: false })
  }

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader
          title="Gestion de stock"
          description="Enregistrer les entrées quotidiennes et valider les stocks physiques."
          icon={Warehouse}
          accentClassName={MODULE_HEADER_ACCENTS.stock}
        >
          <Button type="button" variant="outline" onClick={() => router.visit('/')}>
            <ArrowLeft className="mr-2 size-4" />
            Retour
          </Button>
        </PageHeader>

        {/* Barre de contrôle */}
        <section className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              max={todayKey}
              onChange={(e) => changeSelectedDate(e.target.value)}
              className="w-full sm:w-44"
            />
          </div>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher un produit..."
            className="w-full max-w-none sm:max-w-xs"
            inputClassName="h-8"
          />
        </section>

        {/* Vue en split : Tableau + Panneau de détails */}
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun produit trouvé"
            description="Aucun produit ne correspond à votre recherche."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_450px]">
            {/* Tableau maître */}
            {/* Liste mobile : évite le tableau horizontal sur petit écran. */}
            <div className="grid gap-3 md:hidden">
              {filteredItems.map((item) => {
                const hasMovement = item.id !== -1
                const isSelected = selectedMovementId === item.productId

                return (
                  <StockMobileCard
                    key={item.productId}
                    item={item}
                    hasMovement={hasMovement}
                    isSelected={isSelected}
                    onSelect={() => setSelectedMovementId(item.productId)}
                  />
                )
              })}
            </div>

            <div className="hidden h-[70vh] overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
              <div className="h-full overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Produit</TableHead>
                      <TableHead className="font-semibold">Catégorie</TableHead>
                      <TableHead className="text-right font-semibold">Stock Initial</TableHead>
                      <TableHead className="text-right font-semibold">Entrées</TableHead>
                      <TableHead className="text-right font-semibold">Disponible</TableHead>
                      <TableHead className="text-right font-semibold">Sorties</TableHead>
                      <TableHead className="text-right font-semibold">Pertes</TableHead>
                      <TableHead className="text-right font-semibold">Théorique</TableHead>
                      <TableHead className="text-right font-semibold">Physique</TableHead>
                      <TableHead className="text-right font-semibold">Écart</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const hasMovement = item.id !== -1
                      const isSelected = selectedMovementId === item.productId

                      return (
                        <TableRow
                          key={item.productId}
                          onClick={() => setSelectedMovementId(item.productId)}
                          className={`cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                            !hasMovement ? 'opacity-60' : ''
                          } ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{item.productName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">
                              {item.categoryName || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatQuantity(item.initialStock)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-blue-600">
                              {formatQuantity(item.entries)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatQuantity(item.availableStock)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-red-600">
                              {formatQuantity(item.outputs)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-orange-600">
                              {formatQuantity(item.losses)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatQuantity(item.theoreticalStock)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-bold">{formatQuantity(item.physicalStock)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.variance !== null && (
                              <span
                                className={`font-bold ${
                                  Math.abs(item.variance) > 0
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {formatQuantity(item.variance)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Panneau de détails */}
            {selectedMovement && (
              <StockDetailPanel
                movement={selectedMovement}
                onClose={() => setSelectedMovementId(null)}
                onCreateEntry={openEntryDialog}
                onValidatePhysical={openPhysicalDialog}
              />
            )}
          </div>
        )}

        {/* Dialog pour enregistrer les entrées */}
        {entryDialogOpen && selectedMovement && (
          <StockEntryDialog
            open={entryDialogOpen}
            movement={selectedMovement}
            onClose={() => {
              setEntryDialogOpen(false)
            }}
          />
        )}

        {/* Dialog pour valider le stock physique et les pertes */}
        {physicalDialogOpen && selectedMovement && (
          <StockPhysicalDialog
            open={physicalDialogOpen}
            movement={selectedMovement}
            onClose={() => {
              setPhysicalDialogOpen(false)
            }}
          />
        )}
      </section>
    </main>
  )
}

function StockMobileCard({
  item,
  hasMovement,
  isSelected,
  onSelect,
}: {
  item: InventoryPageProps['stockItems'][number]
  hasMovement: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`grid w-full gap-3 rounded-lg border p-3 text-left transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
          : 'border-border bg-card hover:border-primary/50'
      } ${!hasMovement ? 'opacity-70' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.productName}</p>
          <p className="truncate text-xs text-muted-foreground">{item.categoryName || '—'}</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {item.productBaseUnit}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <StockMobileMetric label="Initial" value={formatQuantity(item.initialStock)} />
        <StockMobileMetric label="Entrées" value={formatQuantity(item.entries)} accent="blue" />
        <StockMobileMetric label="Disponible" value={formatQuantity(item.availableStock)} strong />
        <StockMobileMetric label="Sorties" value={formatQuantity(item.outputs)} accent="red" />
        <StockMobileMetric label="Théorique" value={formatQuantity(item.theoreticalStock)} strong />
        <StockMobileMetric
          label="Écart"
          value={item.variance === null ? '-' : formatQuantity(item.variance)}
          accent={item.variance !== null && Math.abs(item.variance) > 0 ? 'amber' : 'emerald'}
          strong
        />
      </div>
    </button>
  )
}

function StockMobileMetric({
  label,
  value,
  accent,
  strong = false,
}: {
  label: string
  value: string | number
  accent?: 'blue' | 'red' | 'amber' | 'emerald'
  strong?: boolean
}) {
  const accentClassName = accent
    ? {
        blue: 'text-blue-600',
        red: 'text-red-600',
        amber: 'text-amber-600',
        emerald: 'text-emerald-600',
      }[accent]
    : 'text-foreground'

  return (
    <div className="min-w-0 rounded-md bg-muted/40 px-2 py-1.5">
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <p
        className={`truncate text-xs ${accentClassName} ${
          strong ? 'font-semibold' : 'font-medium'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

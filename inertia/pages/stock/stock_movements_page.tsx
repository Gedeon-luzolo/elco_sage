import { router } from '@inertiajs/react'
import { ArrowLeft, Package, Warehouse } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
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
import { StockEntryDialog } from '~/components/stock/stock_entry_dialog'
import { StockPhysicalDialog } from '~/components/stock/stock_physical_dialog'
import { formatQuantity, filterStockMovements } from '~/utils/stock'
import { getLocalDateKey } from '~/utils/date'

/**
 * Page principale de gestion des mouvements de stock journaliers.
 * Permet de visualiser, enregistrer les entrées et valider les stocks physiques.
 */
export default function StockMovementsPage({ stockItems, currentDate }: InventoryPageProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null)
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [physicalDialogOpen, setPhysicalDialogOpen] = useState(false)
  const todayKey = getLocalDateKey()

  // Filtrer les produits par recherche
  const filteredItems = filterStockMovements(stockItems, searchTerm)

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
        >
          <Button type="button" variant="outline" onClick={() => router.visit('/')}>
            <ArrowLeft className="mr-2 size-4" />
            Retour
          </Button>
        </PageHeader>

        {/* Barre de contrôle */}
        <section className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              max={todayKey}
              onChange={(e) => changeSelectedDate(e.target.value)}
              className="w-44"
            />
          </div>

          <Input
            type="search"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
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
            <div className="h-[70vh] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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

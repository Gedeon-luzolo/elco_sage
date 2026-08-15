import { AlertTriangle, ArrowDown, CheckCircle2, Pencil, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { StockMovementItem } from '~/types/stock_types'
import { formatQuantityWithUnit, hasSignificantVariance } from '~/utils/stock'
import { cn } from '~/lib/utils'

export interface StockDetailPanelProps {
  movement: StockMovementItem
  onClose: () => void
  onCreateEntry?: (movement: StockMovementItem) => void
  onValidatePhysical?: (movement: StockMovementItem) => void
}

/**
 * Panneau de details d'un mouvement de stock.
 * Les actions restent visibles pour permettre une correction tant que le backend l'autorise.
 */
export function StockDetailPanel({
  movement,
  onClose,
  onCreateEntry,
  onValidatePhysical,
}: StockDetailPanelProps) {
  const hasMovement = movement.id !== -1
  const hasEntries = Number(movement.entries || 0) > 0
  const hasVariance = hasSignificantVariance(movement)

  return (
    <div className="h-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
      {/* En-tête */}
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{movement.productName}</h3>
          {movement.categoryName && (
            <p className="text-sm text-muted-foreground">{movement.categoryName}</p>
          )}
          {movement.productPackagingUnit && movement.productPackagingCapacity && (
            <p className="mt-1 text-xs text-muted-foreground">
              1 {movement.productPackagingUnit} = {movement.productPackagingCapacity}{' '}
              {movement.productBaseUnit}s
            </p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2">
          {onCreateEntry && (
            <Button
              type="button"
              onClick={() => onCreateEntry(movement)}
              size="sm"
              variant="outline"
              title={hasEntries ? 'Corriger les entrées' : 'Enregistrer des entrées'}
              className="size-8 p-0"
            >
              {hasEntries ? <Pencil className="size-4" /> : <ArrowDown className="size-4" />}
            </Button>
          )}

          {hasMovement && onValidatePhysical && (
            <Button
              type="button"
              onClick={() => onValidatePhysical(movement)}
              size="sm"
              variant="outline"
              title="Valider le stock physique"
              className="size-8 p-0"
            >
              <CheckCircle2 className="size-4" />
            </Button>
          )}

          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="size-8 p-0">
            <X className="size-5" />
          </Button>
        </div>
      </div>

      {/* Contenu */}
      <div className="space-y-4 p-4">
        {/* Informations détaillées */}
        <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
          <h4 className="text-sm font-semibold text-foreground">Details du stock</h4>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stock initial :</span>
              <span className="font-medium">
                {formatQuantityWithUnit(movement.initialStock, movement.productBaseUnit)}
              </span>
            </div>

            {hasMovement && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Entrées :</span>
                  <span className="font-semibold text-blue-600">
                    {formatQuantityWithUnit(movement.entries, movement.productBaseUnit)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stock disponible :</span>
                  <span className="font-medium">
                    {formatQuantityWithUnit(movement.availableStock, movement.productBaseUnit)}
                  </span>
                </div>

                {movement.outputs !== null && movement.outputs > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sorties :</span>
                    <span className="font-semibold text-red-600">
                      {formatQuantityWithUnit(movement.outputs, movement.productBaseUnit)}
                    </span>
                  </div>
                )}

                {movement.losses !== null && movement.losses > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pertes :</span>
                    <span className="font-semibold text-orange-600">
                      {formatQuantityWithUnit(movement.losses, movement.productBaseUnit)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stock théorique :</span>
                  <span className="font-medium">
                    {formatQuantityWithUnit(movement.theoreticalStock, movement.productBaseUnit)}
                  </span>
                </div>

                {movement.physicalStock !== null && (
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Stock physique :</span>
                    <span className="font-bold text-foreground">
                      {formatQuantityWithUnit(movement.physicalStock, movement.productBaseUnit)}
                    </span>
                  </div>
                )}

                {movement.variance !== null && (
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-md px-2 py-1.5',
                      hasVariance
                        ? 'bg-amber-100/50 dark:bg-amber-900/20'
                        : 'bg-emerald-100/50 dark:bg-emerald-900/20'
                    )}
                  >
                    <span className="font-medium">Écart :</span>
                    <span
                      className={cn(
                        'flex items-center gap-1.5 font-bold',
                        hasVariance ? 'text-amber-600' : 'text-emerald-600'
                      )}
                    >
                      {hasVariance && <AlertTriangle className="size-4" />}
                      {formatQuantityWithUnit(movement.variance, movement.productBaseUnit)}
                    </span>
                  </div>
                )}

                {movement.observation && (
                  <div className="border-t border-border pt-3">
                    <span className="text-muted-foreground">Observation :</span>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {movement.observation}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

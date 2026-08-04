import { router } from '@inertiajs/react'
import { Package } from 'lucide-react'
import { useState } from 'react'
import { SubmitButton } from '~/components/common/submit_button'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { StockMovementItem, StockUnit } from '~/types/stock_types'
import { formatDateLabel } from '~/utils/date'
import { formatQuantityWithUnit, getConversionPreview } from '~/utils/stock'

interface StockEntryDialogProps {
  open: boolean
  movement: StockMovementItem
  onClose: () => void
}

export function StockEntryDialog({ open, movement, onClose }: StockEntryDialogProps) {
  const [selectedUnit, setSelectedUnit] = useState<StockUnit>('base')
  const [quantity, setQuantity] = useState<string>(movement.entries?.toString() ?? '')

  const hasMovement = movement.id !== -1
  const hasPackaging = movement.productPackagingUnit && movement.productPackagingCapacity
  const conversionPreview = getConversionPreview(quantity, selectedUnit, movement)

  // Reinitialise l'etat local quand la mutation reussit ou quand l'utilisateur annule.
  const closeDialog = () => {
    setQuantity('')
    setSelectedUnit('base')
    onClose()
  }

  const handleSubmit = (formData: FormData) => {
    // Les champs visibles viennent du FormData, les champs de contexte viennent du mouvement courant.
    const payload = {
      ...Object.fromEntries(formData),
      productId: movement.productId,
      date: movement.date,
      unit: selectedUnit,
    }
    const options = { preserveScroll: true, onSuccess: closeDialog }

    // id = -1 signifie qu'aucun mouvement n'existe encore en base pour cette date.
    if (hasMovement) {
      router.put(`/stock/movements/${movement.id}`, payload, options)
    } else {
      router.post('/stock/movements', payload, options)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer des entrees</DialogTitle>
          <DialogDescription>
            Saisir les quantites entrees en stock pour {movement.productName} le{' '}
            {formatDateLabel(movement.date)}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" action={handleSubmit}>
          {/* Resume du produit pour eviter d'enregistrer une entree sur le mauvais article. */}
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Package className="size-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{movement.productName}</p>
                {movement.categoryName && (
                  <p className="text-xs text-muted-foreground">{movement.categoryName}</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-sm">
              <span className="text-muted-foreground">Stock initial :</span>
              <span className="font-semibold text-foreground">
                {formatQuantityWithUnit(movement.initialStock, movement.productBaseUnit)}
              </span>
            </div>

            {hasPackaging && (
              <div className="mt-1 text-xs text-muted-foreground">
                1 {movement.productPackagingUnit} = {movement.productPackagingCapacity}{' '}
                {movement.productBaseUnit}s
              </div>
            )}
          </div>

          {/* Quantite entree et unite de saisie sur la meme ligne. */}
          <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
            <div className="grid gap-2">
              <Label htmlFor="entries">Quantite entree *</Label>
              <Input
                id="entries"
                name="entries"
                type="number"
                min={0}
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="ex: 10"
                className="h-10"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Unite</Label>
              <Select
                value={selectedUnit}
                onValueChange={(value) => setSelectedUnit(value as StockUnit)}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">{movement.productBaseUnit}</SelectItem>
                  {hasPackaging && (
                    <SelectItem value="packaging">{movement.productPackagingUnit}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {conversionPreview && (
              <p className="text-sm text-blue-600 sm:col-span-2">
                <strong>Conversion :</strong> {conversionPreview}
              </p>
            )}
          </div>

          {/* Observation commune au mouvement : justification, correction ou remarque libre. */}
          <div className="grid gap-2">
            <Label htmlFor="entry-observation">Observation</Label>
            <textarea
              id="entry-observation"
              name="observation"
              defaultValue={movement.observation ?? ''}
              maxLength={500}
              rows={3}
              placeholder="Ajouter une remarque utile..."
              className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" size="lg" variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <SubmitButton size="lg" label="Enregistrer" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

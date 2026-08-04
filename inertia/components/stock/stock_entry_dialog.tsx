import { router } from '@inertiajs/react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { SubmitButton } from '~/components/common/submit_button'
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
import { getConversionPreview, formatQuantityWithUnit } from '~/utils/stock'
import { Package } from 'lucide-react'

interface StockEntryDialogProps {
  open: boolean
  movement: StockMovementItem
  selectedDate: string
  onClose: () => void
}

export function StockEntryDialog({ open, movement, selectedDate, onClose }: StockEntryDialogProps) {
  const [selectedUnit, setSelectedUnit] = useState<StockUnit>('base')
  const [quantity, setQuantity] = useState<string>('')

  // Vérifier si le produit a une unité de conditionnement
  const hasPackaging = movement.productPackagingUnit && movement.productPackagingCapacity
  const conversionPreview = getConversionPreview(quantity, selectedUnit, movement)

  // Créer le payload final pour l'envoi au backend
  const handleSubmit = (formData: FormData) => {
    router.post('/stock/movements', Object.fromEntries(formData), {
      preserveScroll: true,
      onSuccess: () => {
        setQuantity('')
        setSelectedUnit('base')
        onClose()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer des entrées</DialogTitle>
          <DialogDescription>
            Saisir les quantités entrées en stock pour {movement.productName} le{' '}
            {new Date(selectedDate).toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" action={handleSubmit}>
          <input type="hidden" name="productId" value={movement.productId} />
          <input type="hidden" name="date" value={selectedDate} />
          <input type="hidden" name="unit" value={selectedUnit} />

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

          <div className="grid gap-2">
            <Label htmlFor="unit">Unité de saisie *</Label>
            <Select
              id="unit"
              value={selectedUnit}
              onValueChange={(v) => setSelectedUnit(v as StockUnit)}
            >
              <SelectTrigger className="h-10">
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

          <div className="grid gap-2">
            <Label htmlFor="entries">
              Quantité entrée *{' '}
              <span className="text-xs text-muted-foreground">
                (en{' '}
                {selectedUnit === 'base' ? movement.productBaseUnit : movement.productPackagingUnit}
                )
              </span>
            </Label>
            <Input
              id="entries"
              name="entries"
              type="number"
              min={0}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="ex: 10"
              className="h-10"
              required
            />

            {conversionPreview && (
              <p className="text-sm text-blue-600">
                <strong>Conversion :</strong> {conversionPreview}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" size="lg" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <SubmitButton size="lg" label="Enregistrer" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { router } from '@inertiajs/react'
import { ClipboardCheck, Package } from 'lucide-react'
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
import { getProductUnitOptions, hasProductPackaging } from '~/utils/products/product.utils'
import { formatQuantityWithUnit, getConversionPreview } from '~/utils/stock'

interface StockPhysicalDialogProps {
  open: boolean
  movement: StockMovementItem
  onClose: () => void
}

export function StockPhysicalDialog({ open, movement, onClose }: StockPhysicalDialogProps) {
  const [physicalStockUnit, setPhysicalStockUnit] = useState<StockUnit>('base')
  const [lossesUnit, setLossesUnit] = useState<StockUnit>('base')
  const [physicalStock, setPhysicalStock] = useState(movement.physicalStock?.toString() ?? '')
  const [losses, setLosses] = useState(movement.losses?.toString() ?? '')

  const hasMovement = movement.id !== -1
  const hasPackaging = hasProductPackaging(movement)
  const unitOptions = getProductUnitOptions(movement)
  const physicalPreview = getConversionPreview(physicalStock, physicalStockUnit, movement)
  const lossesPreview = getConversionPreview(losses, lossesUnit, movement)

  // Reinitialise l'etat local quand la mutation reussit ou quand l'utilisateur annule.
  const closeDialog = () => {
    setPhysicalStock('')
    setLosses('')
    setPhysicalStockUnit('base')
    setLossesUnit('base')
    onClose()
  }

  const handleSubmit = (formData: FormData) => {
    const lossesValue = String(formData.get('losses') || '')
    // Les champs visibles viennent du FormData, les champs de contexte viennent du mouvement courant.
    const payload: Record<string, FormDataEntryValue> = {
      ...Object.fromEntries(formData),
      productId: movement.productId,
      date: movement.date,
      physicalStockUnit,
    }
    const options = { preserveScroll: true, onSuccess: closeDialog }

    // Si aucune perte n'est saisie, on n'envoie pas lossesUnit inutilement.
    if (lossesValue) {
      payload.lossesUnit = lossesUnit
    } else {
      delete payload.losses
    }

    // id = -1 signifie qu'aucun mouvement n'existe encore en base pour cette date.
    if (hasMovement) {
      router.put(`/stock/validate-physical/${movement.id}`, payload, options)
    } else {
      router.post('/stock/validate-physical', payload, options)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Valider le stock physique</DialogTitle>
          <DialogDescription>
            Saisir le stock physique et les pertes pour {movement.productName} le{' '}
            {formatDateLabel(movement.date)}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" action={handleSubmit}>
          {/* Resume du mouvement pour eviter de valider le mauvais produit. */}
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm">
              <ClipboardCheck className="size-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{movement.productName}</p>
                {movement.categoryName && (
                  <p className="text-xs text-muted-foreground">{movement.categoryName}</p>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-2 border-t border-border pt-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Stock theorique :</span>
                <span className="font-semibold text-foreground">
                  {formatQuantityWithUnit(movement.theoreticalStock, movement.productBaseUnit)}
                </span>
              </div>

              {hasPackaging && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="size-3.5" />1 {movement.productPackagingUnit} ={' '}
                  {movement.productPackagingCapacity} {movement.productBaseUnit}s
                </div>
              )}
            </div>
          </div>

          {/* Stock physique reel observe en fin de journee. */}
          <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
            <div className="grid gap-2">
              <Label htmlFor="physicalStock">Stock physique *</Label>
              <Input
                id="physicalStock"
                name="physicalStock"
                type="number"
                min={0}
                step="0.01"
                value={physicalStock}
                onChange={(event) => setPhysicalStock(event.target.value)}
                placeholder="ex: 120"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Unite</Label>
              <Select
                items={unitOptions}
                value={physicalStockUnit}
                onValueChange={(value) => setPhysicalStockUnit(value as StockUnit)}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {physicalPreview && (
              <p className="text-sm text-blue-600 sm:col-span-2">
                <strong>Conversion :</strong> {physicalPreview}
              </p>
            )}
          </div>

          {/* Pertes optionnelles : casse, vol, avarie ou difference connue. */}
          <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
            <div className="grid gap-2">
              <Label htmlFor="losses">Pertes</Label>
              <Input
                id="losses"
                name="losses"
                type="number"
                min={0}
                step="0.01"
                value={losses}
                onChange={(event) => setLosses(event.target.value)}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2">
              <Label>Unite</Label>
              <Select
                items={unitOptions}
                value={lossesUnit}
                onValueChange={(value) => setLossesUnit(value as StockUnit)}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {lossesPreview && (
              <p className="text-sm text-blue-600 sm:col-span-2">
                <strong>Conversion :</strong> {lossesPreview}
              </p>
            )}
          </div>

          {/* Observation commune au mouvement : justification, correction ou remarque libre. */}
          <div className="grid gap-2">
            <Label htmlFor="physical-observation">Observation</Label>
            <textarea
              id="physical-observation"
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
            <SubmitButton size="lg" label="Valider" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

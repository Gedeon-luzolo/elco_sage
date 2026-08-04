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
import { formatQuantityWithUnit, getConversionPreview } from '~/utils/stock'

interface StockPhysicalDialogProps {
  open: boolean
  movement: StockMovementItem
  selectedDate: string
  onClose: () => void
}

export function StockPhysicalDialog({
  open,
  movement,
  selectedDate,
  onClose,
}: StockPhysicalDialogProps) {
  const [physicalStockUnit, setPhysicalStockUnit] = useState<StockUnit>('base')
  const [lossesUnit, setLossesUnit] = useState<StockUnit>('base')
  const [physicalStock, setPhysicalStock] = useState('')
  const [losses, setLosses] = useState('')

  const hasPackaging = movement.productPackagingUnit && movement.productPackagingCapacity
  const physicalPreview = getConversionPreview(physicalStock, physicalStockUnit, movement)
  const lossesPreview = getConversionPreview(losses, lossesUnit, movement)

  const handleSubmit = (formData: FormData) => {
    // Les champs venant des props ou de l'etat React ne sont pas dupliques en inputs caches.
    // On construit le payload final ici pour garder le DOM limite aux champs visibles.
    const lossesValue = String(formData.get('losses') || '')
    const payload: Record<string, string> = {
      productId: movement.productId,
      date: selectedDate,
      physicalStock: String(formData.get('physicalStock') || ''),
      physicalStockUnit,
    }

    // Si aucune perte n'est saisie, on laisse le backend appliquer sa valeur par defaut.
    if (lossesValue) {
      payload.losses = lossesValue
      payload.lossesUnit = lossesUnit
    }

    router.post('/stock/validate-physical', payload, {
      preserveScroll: true,
      onSuccess: () => {
        setPhysicalStock('')
        setLosses('')
        setPhysicalStockUnit('base')
        setLossesUnit('base')
        onClose()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Valider le stock physique</DialogTitle>
          <DialogDescription>
            Saisir le stock physique et les pertes pour {movement.productName} le{' '}
            {new Date(selectedDate).toLocaleDateString('fr-FR')}.
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
                value={physicalStockUnit}
                onValueChange={(value) => setPhysicalStockUnit(value as StockUnit)}
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
                value={lossesUnit}
                onValueChange={(value) => setLossesUnit(value as StockUnit)}
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

            {lossesPreview && (
              <p className="text-sm text-blue-600 sm:col-span-2">
                <strong>Conversion :</strong> {lossesPreview}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" size="lg" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <SubmitButton size="lg" label="Valider" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

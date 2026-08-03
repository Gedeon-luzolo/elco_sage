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
import type { ProductCategoryDTO } from '#transformers/product_category_transformer'
import type { ProductServiceItem } from '~/types/product_service_types'
import { Currency } from '#types/currency'

interface ProductServiceModalProps {
  title: string
  description: string
  open: boolean
  item: ProductServiceItem | null
  submitLabel: string
  categories: ProductCategoryDTO[]
  defaultType?: 'PRODUCT' | 'SERVICE'
  onOpenChange: (open: boolean) => void
  action: (formData: FormData) => void | Promise<void>
}

/**
 * Boîte de dialogue (Modal) pour la création et la modification d'un produit ou service.
 * Dispose les champs en grille 2 colonnes, avec réorganisation Devise -> Prix
 * et mise à jour dynamique du prix selon la devise sélectionnée en édition.
 */
export function ProductServiceModal({
  title,
  description,
  open,
  item,
  submitLabel,
  categories,
  defaultType = 'PRODUCT',
  onOpenChange,
  action,
}: ProductServiceModalProps) {
  // Détermine si le modal est en mode édition ou création.
  const isEditing = item !== null

  // État local pour suivre le type sélectionné (PRODUIT ou SERVICE).
  const [selectedType, setSelectedType] = useState<'PRODUCT' | 'SERVICE'>(
    (item?.type as 'PRODUCT' | 'SERVICE') ?? defaultType
  )

  // État local pour la devise sélectionnée (CDF par défaut).
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.CDF)

  // État local contrôlé pour le montant du prix.
  const [priceValue, setPriceValue] = useState<string | number>(
    item ? item.priceCdf : ''
  )

  const isService = selectedType === 'SERVICE'

  /**
   * Lors du changement de devise, si un élément existe en édition,
   * la valeur du prix est mise à jour instantanément vers le montant correspondant (USD ou CDF).
   */
  const handleCurrencyChange = (value: Currency | null) => {
    if (!value) return
    setSelectedCurrency(value)

    if (item) {
      setPriceValue(value === Currency.USD ? item.priceUsd : item.priceCdf)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Réinitialise le formulaire lors du changement d'élément ou de type par défaut */}
        <form
          key={`${title}-${item?.id ?? 'new'}-${defaultType}`}
          className="grid gap-5"
          action={action}
        >
          {/* Disposition en grille 2 colonnes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Type : Produit ou Service (Pleine largeur) */}
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="ps-type">Type d'article *</Label>
              <Select
                id="ps-type"
                name="type"
                defaultValue={selectedType}
                onValueChange={(v) => setSelectedType(v as 'PRODUCT' | 'SERVICE')}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCT">Produit (Article physique)</SelectItem>
                  <SelectItem value="SERVICE">Service (Prestation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nom de l'article */}
            <div className="grid gap-2">
              <Label htmlFor="ps-name">Nom de l'article *</Label>
              <Input
                id="ps-name"
                name="name"
                className="h-10 px-3"
                defaultValue={item?.name ?? ''}
                placeholder={isService ? 'ex: Impression N/B A4, Plastification...' : 'ex: Papier A4 80g, Encre noire...'}
                required
              />
            </div>

            {/* Catégorie associée (en face du Nom) */}
            <div className="grid gap-2">
              <Label htmlFor="ps-category">Catégorie</Label>
              <Select
                id="ps-category"
                name="categoryId"
                defaultValue={item?.categoryId ?? ''}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner une catégorie..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unité de base (Vente / Consommation) */}
            <div className="grid gap-2">
              <Label htmlFor="ps-base-unit">
                {isService ? "Unité de facturation *" : "Unité de base *"}
              </Label>
              <Input
                id="ps-base-unit"
                name="baseUnit"
                className="h-10 px-3"
                defaultValue={item?.baseUnit ?? ''}
                placeholder={isService ? 'ex: unité, heure, page...' : 'ex: feuille, litre, kg...'}
                required
              />
            </div>

            {/* Statut — visible uniquement en édition */}
            {isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="ps-status">Statut d'activation</Label>
                <Select
                  id="ps-status"
                  name="isActive"
                  defaultValue={String(item.isActive)}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Actif</SelectItem>
                    <SelectItem value="false">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Champs de conditionnement — affichés uniquement pour les PRODUITS */}
            {!isService && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="ps-packaging-unit">Unité de conditionnement</Label>
                  <Input
                    id="ps-packaging-unit"
                    name="packagingUnit"
                    className="h-10 px-3"
                    defaultValue={item?.packagingUnit ?? ''}
                    placeholder="ex: rame, carton..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ps-packaging-capacity">Capacité (Unité de base par rame/carton)</Label>
                  <Input
                    id="ps-packaging-capacity"
                    name="packagingCapacity"
                    type="number"
                    min={1}
                    className="h-10 px-3"
                    defaultValue={item?.packagingCapacity ?? ''}
                    placeholder="ex: 500"
                  />
                </div>
              </>
            )}

            {/* Devise (placée AVANT le prix) */}
            <div className="grid gap-2">
              <Label htmlFor="ps-currency">Devise *</Label>
              <Select
                id="ps-currency"
                name="currency"
                value={selectedCurrency}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Currency).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prix de vente (placé APPRÈS la devise, avec valeur contrôlée dynamiquement) */}
            <div className="grid gap-2">
              <Label htmlFor="ps-price">Prix de vente *</Label>
              <Input
                id="ps-price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                className="h-10 px-3"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                placeholder="ex: 25000 ou 10"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" size="lg" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <SubmitButton size="lg" label={submitLabel} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

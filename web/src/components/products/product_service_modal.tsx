import { useState, type FormEvent } from 'react'
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
import { OptionSelect } from '~/components/common/option_select'
import { SearchableSelect } from '~/components/common/searchable_select'
import type { ProductCategoryDTO } from '~/types/dto'
import type { ProductServiceItem } from '~/types/product_service_types'
import { CURRENCY_OPTIONS, Currency } from '~/utils/currency'
import { getItemPriceForCurrency } from '~/utils/products/product.utils'
import { ACTIVE_STATUS_OPTIONS } from '~/utils/status.utils'

interface ProductServiceModalProps {
  title: string
  description: string
  open: boolean
  item: ProductServiceItem | null
  submitLabel: string
  categories: ProductCategoryDTO[]
  products: ProductServiceItem[]
  defaultType?: 'PRODUCT' | 'SERVICE'
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isPending?: boolean
}

// Option vide de la liste des produits liés : un service peut ne consommer aucun produit.
const NO_STOCK_PRODUCT = { id: '', name: 'Aucun produit lié' } as ProductServiceItem

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
  products,
  defaultType = 'PRODUCT',
  onOpenChange,
  onSubmit,
  isPending = false,
}: ProductServiceModalProps) {
  // Détermine si le modal est en mode édition ou création.
  const isEditing = item !== null

  // Le type n'est plus choisi dans le formulaire : il vient de l'onglet actif (création) ou de l'article (édition).
  const selectedType = (item?.type as 'PRODUCT' | 'SERVICE' | undefined) ?? defaultType

  // État local pour la devise sélectionnée (CDF par défaut).
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.CDF)

  // État local contrôlé pour le montant du prix.
  const [priceValue, setPriceValue] = useState<string | number>(
    item ? getItemPriceForCurrency(item, Currency.CDF) : ''
  )

  // Choix de la catégorie, envoyé avec le formulaire
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '')

  // Produit lié d'un service, facultatif : vide si le service ne consomme aucun produit
  const [stockProductId, setStockProductId] = useState(item?.stockProductId ?? '')

  const isService = selectedType === 'SERVICE'

  // Produits actifs, plus le produit déjà lié s'il a été désactivé depuis.
  // Le choix « Aucun produit lié » permet de retirer le lien.
  const stockProductOptions = [
    NO_STOCK_PRODUCT,
    ...products.filter((product) => product.isActive || product.id === item?.stockProductId),
  ]
  /**
   * Lors du changement de devise, si un élément existe en édition,
   * la valeur du prix est mise à jour instantanément vers le montant correspondant (USD ou CDF).
   */
  const handleCurrencyChange = (value: Currency) => {
    setSelectedCurrency(value)

    if (item) {
      setPriceValue(getItemPriceForCurrency(item, value))
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
          onSubmit={onSubmit}
        >
          {/* Disposition en grille 2 colonnes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Le type part avec le formulaire sans être affiché */}
            <input type="hidden" name="type" value={selectedType} />

            {/* Nom de l'article */}
            <div className="grid gap-2">
              <Label htmlFor="ps-name">{isService ? 'Nom du service *' : 'Nom du produit *'}</Label>
              <Input
                id="ps-name"
                name="name"
                className="h-10 px-3"
                defaultValue={item?.name ?? ''}
                placeholder={
                  isService
                    ? 'ex: Impression N/B A4, Plastification...'
                    : 'ex: Papier A4 80g, Encre noire...'
                }
                required
              />
            </div>

            {/* Catégorie associée (en face du Nom) */}
            <div className="grid gap-2">
              <Label htmlFor="ps-category">Catégorie</Label>
              <SearchableSelect
                id="ps-category"
                name="categoryId"
                items={categories}
                value={categoryId}
                onValueChange={setCategoryId}
                getValue={(category) => category.id}
                getLabel={(category) => category.name}
                placeholder="Sélectionner une catégorie..."
                emptyMessage="Aucune catégorie trouvée."
              />
            </div>

            {/* Unité de base (Vente / Consommation) */}
            {isService ? (
              <>
                <Input type="hidden" name="baseUnit" value="" />

                {/* Produit consommé par le service (ex : le papier d'une impression), facultatif */}
                <div className="grid gap-2">
                  <Label htmlFor="ps-stock-product">Produit lié</Label>
                  <SearchableSelect
                    id="ps-stock-product"
                    name="stockProductId"
                    items={stockProductOptions}
                    value={stockProductId}
                    onValueChange={setStockProductId}
                    getValue={(product) => product.id}
                    getLabel={(product) => product.name}
                    placeholder="Aucun produit lié"
                    emptyMessage="Aucun produit trouvé."
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="ps-base-unit">Unité de base *</Label>
                <Input
                  id="ps-base-unit"
                  name="baseUnit"
                  className="h-10 px-3"
                  defaultValue={item?.baseUnit ?? ''}
                  placeholder="ex: feuille, litre, kg..."
                  required
                />
              </div>
            )}

            {/* Statut — visible uniquement en édition */}
            {isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="ps-status">Statut d&apos;activation</Label>
                <OptionSelect
                  id="ps-status"
                  name="isActive"
                  options={ACTIVE_STATUS_OPTIONS}
                  defaultValue={String(item.isActive)}
                />
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
                  <Label htmlFor="ps-packaging-capacity">
                    Capacité (Unité de base par rame/carton)
                  </Label>
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
              <OptionSelect
                id="ps-currency"
                name="currency"
                options={CURRENCY_OPTIONS}
                value={selectedCurrency}
                onValueChange={(value) => handleCurrencyChange(value as Currency)}
              />
            </div>

            {/* Prix utile selon le type: vente pour service, achat pour produit */}
            <div className="grid gap-2">
              <Label htmlFor="ps-price">
                {isService ? 'Prix de vente ' : "Prix d'achat du conditionnement *"}
              </Label>
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
            <SubmitButton size="lg" label={submitLabel} isPending={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

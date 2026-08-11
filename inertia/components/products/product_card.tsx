import { Edit2, Trash2 } from 'lucide-react'
import { cn } from '~/lib/utils'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import type { ProductServiceItem } from '~/types/product_service_types'

export interface ProductCardProps {
  /** Article (produit ou service) à afficher */
  item: ProductServiceItem
  /** Handler déclenché lors du clic sur le bouton Modifier */
  onEdit: (item: ProductServiceItem) => void
  /** Handler déclenché lors du clic sur le bouton Supprimer */
  onDelete: (item: ProductServiceItem) => void
}

/**
 * Carte d'affichage simplifiée pour un produit ou un service.
 * Alignement vertical en flex-col fluide et épuré.
 */
export function ProductCard({ item, onEdit, onDelete }: ProductCardProps) {
  const isProduct = item.type === 'PRODUCT'
  const priceLabel = isProduct ? "Prix d'achat" : 'Prix de vente'

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-primary/40',
        isProduct ? 'border-t-4 border-t-blue-500' : 'border-t-4 border-t-violet-500'
      )}
    >
      {/* En-tête : Titre et Badge de statut */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-foreground text-base leading-snug">{item.name}</h3>
        <Badge variant={item.isActive ? 'default' : 'secondary'} className="shrink-0 text-xs">
          {item.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      </div>

      {/* Détails des unités */}
      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {item.categoryName && (
          <div>
            Catégorie : <span className="font-medium text-foreground">{item.categoryName}</span>
          </div>
        )}
        {isProduct && (
          <div>
            Unité : <span className="font-medium text-foreground">{item.baseUnit}</span>
          </div>
        )}

        {!isProduct && item.stockProductName && (
          <div className="text-sm text-violet-700 dark:text-violet-300">
            Produit lié : <span className="font-semibold">{item.stockProductName}</span>
          </div>
        )}

        {isProduct && item.packagingUnit && item.packagingCapacity && (
          <div>
            Conditionnement :{' '}
            <span className="font-medium text-foreground">
              1 {item.packagingUnit} = {item.packagingCapacity} {item.baseUnit}s
            </span>
          </div>
        )}
      </div>

      {/* Prix USD et CDF */}
      <div className="flex flex-col text-sm">
        <span className="text-xs text-muted-foreground">{priceLabel}</span>
        <span className="font-semibold text-foreground text-base">
          {formatMoneyWithCurrency(item.priceUsd, 'USD')}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatMoneyWithCurrency(item.priceCdf, 'CDF')}
        </span>
        {isProduct && (
          <span className="mt-1 text-xs text-muted-foreground">
            Coût matière : {formatMoneyWithCurrency(item.materialCostUsd, 'USD')} /{' '}
            {formatMoneyWithCurrency(item.materialCostCdf, 'CDF')}
          </span>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex items-start justify-start gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(item)}
          title="Modifier cet article"
        >
          <Edit2 className="mr-1.5 size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(item)}
          title="Supprimer cet article"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

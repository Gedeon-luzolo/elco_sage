import { Edit2, Trash2 } from 'lucide-react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import type { ProductServiceItem } from '~/types/product_service_types'

interface ProductCardProps {
  item: ProductServiceItem
  onEdit: (item: ProductServiceItem) => void
  onDelete: (item: ProductServiceItem) => void
}

// Pastille d'information (unité, conditionnement, produit lié).
function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  )
}

/**
 * Carte compacte d'un produit ou d'un service : le prix en avant, les détails en pastilles.
 */
export function ProductCard({ item, onEdit, onDelete }: ProductCardProps) {
  const isProduct = item.type === 'PRODUCT'
  const hasPackaging = isProduct && item.packagingUnit && item.packagingCapacity

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-primary/40">
      {/* En-tête : nom, statut et actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base leading-snug font-semibold text-foreground">
            {item.name}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                'size-1.5 rounded-full',
                item.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/50'
              )}
            />
            {item.isActive ? 'Actif' : 'Inactif'}
            {item.categoryName && <span>· {item.categoryName}</span>}
          </p>
        </div>

        <div className="flex shrink-0 gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Modifier cet article"
            title="Modifier cet article"
            onClick={() => onEdit(item)}
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Supprimer cet article"
            title="Supprimer cet article"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Détails en pastilles */}
      <div className="flex flex-wrap gap-1.5">
        {isProduct && item.baseUnit && <InfoPill>{item.baseUnit}</InfoPill>}
        {hasPackaging && (
          <InfoPill>
            1 {item.packagingUnit} = {item.packagingCapacity} {item.baseUnit}s
          </InfoPill>
        )}
        {!isProduct && item.stockProductName && (
          <InfoPill>Produit lié : {item.stockProductName}</InfoPill>
        )}
      </div>

      {/* Prix : francs en avant, dollars en dessous */}
      <div className="mt-auto border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          {isProduct ? "Prix d'achat" : 'Prix de vente'}
        </p>
        <p className="text-lg leading-tight font-bold text-foreground">
          {formatMoneyWithCurrency(item.priceCdf, 'CDF')}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatMoneyWithCurrency(item.priceUsd, 'USD')}
        </p>
        {isProduct && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Coût matière : {formatMoneyWithCurrency(item.materialCostCdf, 'CDF')} / {item.baseUnit}
          </p>
        )}
      </div>
    </div>
  )
}

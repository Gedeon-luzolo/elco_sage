import { Edit2 } from 'lucide-react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import type { ProductServiceItem } from '~/types/product_service_types'

interface ProductCardProps {
  item: ProductServiceItem
  onEdit: (item: ProductServiceItem) => void
}

// Pastille d'information (unité, conditionnement, produit lié).
function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-2.5 py-1 text-sm text-muted-foreground">
      {children}
    </span>
  )
}

/**
 * Carte compacte d'un produit ou d'un service : le prix en avant, les détails en pastilles.
 */
export function ProductCard({ item, onEdit }: ProductCardProps) {
  const isProduct = item.type === 'PRODUCT'
  const hasPackaging = isProduct && item.packagingUnit && item.packagingCapacity

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
      {/* En-tête : nom et catégorie à gauche, statut à droite */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-lg leading-snug font-semibold text-foreground">
            {item.name}
          </h3>
          {item.category && (
            <p className="truncate text-sm text-muted-foreground">
              Catégorie : {item.category.name}
            </p>
          )}
        </div>

        {/* Pastille de statut : verte si actif, grise sinon */}
        <div className="flex h-7 shrink-0 items-center">
          <span
            role="img"
            aria-label={item.isActive ? 'Actif' : 'Inactif'}
            title={item.isActive ? 'Actif' : 'Inactif'}
            className={cn(
              'size-2.5 rounded-full',
              item.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/50'
            )}
          />
        </div>
      </div>

      {/* Détails en pastilles */}
      <div className="flex flex-wrap gap-1.5">
        {isProduct && item.baseUnit && <InfoPill>{item.baseUnit}</InfoPill>}
        {!isProduct && item.stockProduct && (
          <InfoPill>Consomme : {item.stockProduct.name}</InfoPill>
        )}
        {hasPackaging && (
          <InfoPill>
            1 {item.packagingUnit} = {item.packagingCapacity} {item.baseUnit}s
          </InfoPill>
        )}
      </div>

      {/* Prix : francs en avant, dollars en dessous ; modification dans le coin inférieur droit */}
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {isProduct ? "Prix d'achat" : 'Prix de vente'}
          </p>
          <p className="text-2xl leading-tight font-bold text-foreground">
            {formatMoneyWithCurrency(item.priceCdf, 'CDF')}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatMoneyWithCurrency(item.priceUsd, 'USD')}
          </p>
          {isProduct && (
            <p className="mt-2 text-sm text-muted-foreground">
              Coût matière : {formatMoneyWithCurrency(item.materialCostCdf, 'CDF')} /{' '}
              {item.baseUnit}
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Modifier cet article"
          title="Modifier cet article"
          onClick={() => onEdit(item)}
        >
          <Edit2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

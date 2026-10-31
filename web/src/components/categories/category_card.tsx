import { Edit2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import type { ProductCategoryItem } from '~/types/product_category_types'
import { formatShortDate } from '~/utils/date'

interface CategoryCardProps {
  category: ProductCategoryItem
  onEdit: (category: ProductCategoryItem) => void
}

/**
 * Carte compacte d'une catégorie, au même format que les cartes des produits et services.
 */
export function CategoryCard({ category, onEdit }: CategoryCardProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3.5 shadow-xs transition-colors hover:border-primary/40">
      {/* En-tête : nom à gauche, statut à droite */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate text-sm leading-snug font-semibold text-foreground">
          {category.name}
        </h3>

        {/* Pastille de statut : verte si active, grise sinon */}
        <div className="flex h-5 shrink-0 items-center">
          <span
            role="img"
            aria-label={category.isActive ? 'Active' : 'Inactive'}
            title={category.isActive ? 'Active' : 'Inactive'}
            className={cn(
              'size-2 rounded-full',
              category.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/50'
            )}
          />
        </div>
      </div>

      {/* Date de création ; modification dans le coin inférieur droit */}
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-2.5">
        <p className="text-xs text-muted-foreground">
          Créée le {formatShortDate(category.createdAt)}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label="Modifier cette catégorie"
          title="Modifier cette catégorie"
          onClick={() => onEdit(category)}
        >
          <Edit2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

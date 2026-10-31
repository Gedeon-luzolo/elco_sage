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
import type { ProductCategoryItem } from '~/types/product_category_types'
import { ACTIVE_STATUS_OPTIONS } from '~/utils/status.utils'

interface ProductCategoryModalProps {
  title: string
  description: string
  open: boolean
  // En mode création, category est null — le statut est géré par le backend (défaut: true).
  category: ProductCategoryItem | null
  submitLabel: string
  onOpenChange: (open: boolean) => void
  action: (formData: FormData) => void | Promise<void>
  isPending?: boolean
}

export function ProductCategoryModal({
  title,
  description,
  open,
  category,
  submitLabel,
  onOpenChange,
  action,
  isPending = false,
}: ProductCategoryModalProps) {
  // Indique si on est en mode édition (category présente) ou création (null).
  const isEditing = category !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form key={`${title}-${category?.id ?? 'new'}`} className="grid gap-5" action={action}>
          <div className="grid gap-2">
            <Label htmlFor="category-name">Nom de la catégorie *</Label>
            <Input
              id="category-name"
              name="name"
              className="h-10 px-3"
              defaultValue={category?.name ?? ''}
              placeholder="ex: Impression Grand Format, Sérigraphie..."
              required
            />
          </div>

          {/* Le statut est visible uniquement en édition : en création il vaut true par défaut côté service. */}
          {isEditing && (
            <div className="grid gap-2">
              <Label htmlFor="category-status">Statut d'activation</Label>
              <OptionSelect
                id="category-status"
                name="isActive"
                options={ACTIVE_STATUS_OPTIONS}
                defaultValue={category ? String(category.isActive) : 'true'}
              />
            </div>
          )}

          <DialogFooter>
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

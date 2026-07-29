import { CircleAlert, Trash2, type LucideIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

type ConfirmationDialogVariant = 'default' | 'destructive'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmationDialogVariant
  processing?: boolean
  icon?: LucideIcon
  onOpenChange: (open: boolean) => void
  onCancel?: () => void
  onConfirm: () => void
}

// Dialog generique pour confirmer une action utilisateur.
export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
  processing = false,
  icon,
  onOpenChange,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const confirmVariant = variant === 'destructive' ? 'destructive' : 'default'
  const Icon = icon ?? (variant === 'destructive' ? Trash2 : CircleAlert)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="mx-auto flex size-26 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-20" aria-hidden="true" />
        </div>
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-center text-base">{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={processing}
            onClick={onCancel ?? (() => onOpenChange(false))}
          >
            {cancelLabel}
          </Button>
          <Button type="button" variant={confirmVariant} disabled={processing} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

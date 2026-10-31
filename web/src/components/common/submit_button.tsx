import { Loader2 } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Button } from '~/components/ui/button'

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  label: string
  loadingLabel?: string
  icon?: ReactNode
  isPending?: boolean
}

// Bouton d'action : pendant l'opération il est désactivé et affiche un spinner avec un texte d'attente.
export function SubmitButton({
  label,
  loadingLabel = 'Traitement...',
  icon,
  isPending = false,
  disabled,
  type = 'submit',
  ...props
}: SubmitButtonProps) {
  return (
    <Button type={type} disabled={isPending || disabled} aria-busy={isPending} {...props}>
      {/* Le spinner prend la place de l'icône pour que le bouton garde sa largeur */}
      {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {isPending ? loadingLabel : label}
    </Button>
  )
}

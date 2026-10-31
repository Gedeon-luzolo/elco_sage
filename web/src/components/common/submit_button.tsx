import { Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'
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
  // useFormStatus ne voit que les actions asynchrones d'un <form action> (et vaut false hors formulaire) :
  // quand l'action lance un mutation.mutate(), qui rend la main tout de suite, c'est isPending qui compte.
  const { pending } = useFormStatus()
  const isBusy = pending || isPending

  return (
    <Button type={type} disabled={isBusy || disabled} aria-busy={isBusy} {...props}>
      {/* Le spinner prend la place de l'icône pour que le bouton garde sa largeur */}
      {isBusy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {isBusy ? loadingLabel : label}
    </Button>
  )
}

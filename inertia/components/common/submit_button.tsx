import { useFormStatus } from 'react-dom'
import type { ComponentProps } from 'react'
import { Button } from '~/components/ui/button'

import type { ReactNode } from 'react'

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  label: string
  loadingLabel?: string
  icon?: ReactNode
}

export function SubmitButton({
  label,
  loadingLabel = 'Traitement...',
  icon,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {icon && !pending && icon}
      {pending ? loadingLabel : label}
    </Button>
  )
}

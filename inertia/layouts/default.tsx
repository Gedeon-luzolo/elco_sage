import { type Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { type ReactElement, useEffect } from 'react'
import { IdleScreen } from '~/components/auth/idle_screen'
import { TooltipProvider } from '~/components/ui/tooltip'

const IGNORED_FLASH_ERRORS = ['Unauthorized access']

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { url } = usePage()

  useEffect(() => {
    toast.dismiss()
  }, [url])

  useEffect(() => {
    const flashError = children.props.flash.error

    // Ce message vient du framework pendant une redirection auth normale.
    if (flashError && !IGNORED_FLASH_ERRORS.includes(flashError)) {
      toast.error(flashError)
    }
    if (children.props.flash.success) {
      toast.success(children.props.flash.success)
    }
  })

  return (
    <TooltipProvider>
      {children}
      <IdleScreen user={children.props.user} />
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  )
}

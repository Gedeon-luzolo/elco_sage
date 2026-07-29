import { type Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { AnimatePresence, motion } from 'framer-motion'
import { type ReactElement, useEffect } from 'react'

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
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={url}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      <Toaster position="top-center" richColors />
    </>
  )
}

import { router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BrandLogo } from '~/components/brand/brand_logo'

export default function Splash() {
  const [isLeaving, setIsLeaving] = useState(false)

  /**
   * Redirige vers le login apres l'ecran de lancement.
   * Le splash reste uniquement une transition visuelle.
   * replace evite de revenir au splash avec le bouton precedent.
   */
  useEffect(() => {
    const exitTimeoutId = window.setTimeout(() => {
      // On declenche d'abord l'animation de sortie avant la navigation.
      setIsLeaving(true)
    }, 1150)

    const navigationTimeoutId = window.setTimeout(() => {
      router.visit('/login', { replace: true })
    }, 1450)

    return () => {
      window.clearTimeout(exitTimeoutId)
      window.clearTimeout(navigationTimeoutId)
    }
  }, [])

  return (
    <main className="flex min-h-screen w-screen items-center justify-center bg-[#031633] px-6 py-10 text-blue-50">
      <motion.section
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={isLeaving ? { opacity: 0, scale: 0.98, y: -16 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <motion.div
          className="flex size-32 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-2 shadow-2xl shadow-blue-950/30"
          initial={{ opacity: 0, rotate: -8, scale: 0.85 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.45, ease: 'easeOut' }}
        >
          <BrandLogo className="h-full w-full object-contain" />
        </motion.div>
        <motion.h1
          className="sr-only"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35, ease: 'easeOut' }}
        >
          Elco Sage
        </motion.h1>
        <motion.p
          className="mt-8 max-w-sm text-sm text-blue-50/75"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.32, ease: 'easeOut' }}
        >
          Gestion des ventes, du stock et des inventaires
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.25 }}
        >
          <LoaderCircle className="mt-10 size-7 animate-spin text-blue-50/80" aria-hidden="true" />
        </motion.div>
      </motion.section>
    </main>
  )
}

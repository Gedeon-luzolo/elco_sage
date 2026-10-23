import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { BrandLogo } from '~/components/brand/brand_logo'
import { UserProfileBadge } from '~/components/auth/user_profile_badge'
import { useIdle } from '~/hooks/useIdle'
import type { UserDTO } from '~/types/dto'

interface IdleScreenProps {
  user?: UserDTO
}

interface LockedContentProps {
  idle: ReturnType<typeof useIdle>
  user: UserDTO
}

/**
 * Affiche l'écran de veille pendant l'inactivité.
 * La reprise se fait d'un clic ou d'une touche, sans vérification.
 * Délègue l'état de veille au hook useIdle.
 */
function LockedContent({ idle, user }: LockedContentProps) {
  useEffect(() => {
    // Une touche seule suffit pour reprendre, sauf les raccourcis avec modificateur.
    const resumeFromKeyboard = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      idle.resume()
    }

    window.addEventListener('keydown', resumeFromKeyboard)

    // Nettoyage de l'écouteur quand l'écran de veille disparaît.
    return () => {
      window.removeEventListener('keydown', resumeFromKeyboard)
    }
  }, [idle])

  return (
    <motion.div
      className="fixed inset-0 z-9999 flex cursor-pointer items-center justify-center overflow-hidden text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Session en veille"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      onClick={idle.resume}
    >
      <div className="absolute inset-0 bg-[#031633]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,76,255,0.45)_0%,rgba(3,22,51,0.92)_52%,rgba(0,9,26,0.98)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.34)_0%,rgba(0,52,148,0.18)_28%,rgba(0,0,0,0.42)_100%)]" />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-size-[56px_56px]" />

      <div className="absolute inset-0">
        <div className="absolute left-6 top-6 flex items-center gap-3 md:left-12 md:top-8">
          <motion.div
            className="flex size-11 items-center justify-center overflow-hidden rounded-xl bg-white/90 p-1 shadow-lg shadow-blue-950/30"
            animate={{
              y: [0, -4, 0],
              rotate: [0, -3, 3, 0],
              scale: [1, 1.04, 1],
            }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BrandLogo className="h-full w-full object-contain" />
          </motion.div>
          <div>
            <p className="text-2xl font-bold leading-none text-white/85">Elco Sage</p>
            <p className="mt-1 text-xs text-white/65">Session sécurisée</p>
          </div>
        </div>

        <UserProfileBadge
          user={user}
          className="absolute right-6 top-6 hidden md:right-12 md:top-8 md:flex"
        />

        <div className="flex h-full items-center justify-center px-4 text-center text-white">
          <div>
            <motion.h2
              className="text-5xl font-bold leading-none md:text-7xl lg:text-8xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              {idle.formattedTime}
            </motion.h2>
            <motion.p
              className="mt-6 text-2xl font-bold capitalize text-white/90 md:text-4xl lg:text-5xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
            >
              {idle.formattedDate}
            </motion.p>
            <motion.div
              className="mt-16"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <p className="text-sm text-white/75 md:text-base">
                Cliquez ou appuyez sur une touche pour reprendre.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Monte l'overlay de veille dans le layout global.
export function IdleScreen({ user }: IdleScreenProps) {
  const idle = useIdle(user)

  if (!user) {
    return null
  }

  return (
    <AnimatePresence>{idle.isIdle && <LockedContent idle={idle} user={user} />}</AnimatePresence>
  )
}

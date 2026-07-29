import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, LoaderCircle, Lock, X } from 'lucide-react'
import { useState } from 'react'
import { UserProfileBadge } from '~/components/auth/user_profile_badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { useIdle } from '~/hooks/useIdle'
import bgIdleUrl from '~/images/bg-iddle.webp'
import { type Data } from '@generated/data'

interface IdleScreenProps {
  user?: Data.User
}

interface LockedContentProps {
  idle: ReturnType<typeof useIdle>
  user: Data.User
}

/**
 * Affiche l'ecran verrouille pendant l'inactivite.
 * Montre le champ mot de passe seulement apres un clic utilisateur.
 * Delegue la verification au hook useIdle.
 */
function LockedContent({ idle, user }: LockedContentProps) {
  const [isPasswordPromptVisible, setIsPasswordPromptVisible] = useState(false)

  return (
    <motion.div
      className="fixed inset-0 z-9999 flex cursor-pointer items-center justify-center overflow-hidden text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Session verrouillee"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      onClick={() => setIsPasswordPromptVisible(true)}
    >
      <div
        className={`absolute -inset-10 transition-all duration-500 ${
          isPasswordPromptVisible ? 'scale-110 blur-2xl brightness-75' : 'scale-100 blur-0 brightness-100'
        }`}
      >
        <img
          src={bgIdleUrl}
          alt="Fond d'ecran de l'ecran verrouille"
          aria-hidden="true"
          className="size-full object-cover blur-sm"
        />
      </div>
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_34%,rgba(0,0,0,0.35)_100%)]" />

      <div
        className={`absolute inset-0 transition-all duration-500 ${
          isPasswordPromptVisible ? 'scale-110 blur-xl opacity-55' : 'scale-100 blur-0 opacity-100'
        }`}
      >
        <div className="absolute left-6 top-6 flex items-center gap-3 md:left-12 md:top-8">
          <div className="flex size-11 items-center justify-center rounded-full border border-white/50 bg-white/10 text-2xl font-bold backdrop-blur-md">
            e
          </div>
          <div>
            <p className="text-2xl font-bold leading-none text-white/85">Elco Sage</p>
            <p className="mt-1 text-xs text-white/65">Session securisee</p>
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
                {isPasswordPromptVisible
                  ? 'Saisissez votre mot de passe pour reprendre.'
                  : 'Cliquez ou appuyez pour reprendre.'}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isPasswordPromptVisible && (
          <motion.section
            className="relative z-10 flex w-full max-w-sm flex-col items-center px-4 text-white"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <UserProfileBadge user={user} className="mb-8" showRole={false} />

            <div className="w-full">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" />
                <Input
                  className="h-12 rounded-xl border-white/25 bg-white/20 pl-10 text-lg text-white placeholder:text-white/60 backdrop-blur-md focus-visible:border-white/70 focus-visible:ring-white/30"
                  type="password"
                  value={idle.password}
                  placeholder="Mot de passe"
                  autoFocus
                  onChange={(event) => idle.setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      // Le raccourci valide le mot de passe sans bouton supplementaire.
                      void idle.verifyPassword()
                    }
                  }}
                />
              </div>
              {idle.error && (
                <p className="mt-5 text-center text-sm font-medium text-amber-100">{idle.error}</p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <Button
                  className="h-12 flex-1 rounded-xl border-white/70 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
                  type="button"
                  variant="outline"
                  disabled={idle.isVerifying}
                  onClick={() => void idle.verifyPassword()}
                >
                  {idle.isVerifying ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  Deverrouiller
                </Button>
              </div>
            </div>

            <button
              className="mt-32 flex flex-col items-center gap-2 text-white/80 transition-colors hover:text-white"
              type="button"
              aria-label="Annuler le deverrouillage"
              onClick={() => {
                // Le bouton X revient a l'ecran idle simple sans deverrouiller.
                idle.clearPasswordPrompt()
                setIsPasswordPromptVisible(false)
              }}
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-white/70">
                <X className="size-4" />
              </span>
              <span className="text-sm">Annuler</span>
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Monte l'overlay idle dans le layout global.
export function IdleScreen({ user }: IdleScreenProps) {
  const idle = useIdle(user)

  if (!user) {
    return null
  }

  return (
    <AnimatePresence>{idle.isIdle && <LockedContent idle={idle} user={user} />}</AnimatePresence>
  )
}

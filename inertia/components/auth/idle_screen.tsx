import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, LoaderCircle, Lock, ShieldCheck, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { useIdle } from '~/hooks/useIdle'
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
  const displayName = user.fullName || user.email

  return (
    <motion.div
      className="fixed inset-0 z-9999 flex cursor-pointer items-center justify-center overflow-hidden px-6 text-amber-50"
      role="dialog"
      aria-modal="true"
      aria-label="Session verrouillee"
      initial={{ opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      onClick={() => setIsPasswordPromptVisible(true)}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#2b1810_0%,#4b2612_34%,#0c4b2b_68%,#082f1d_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_42%,rgba(0,0,0,0.28)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_32%,rgba(0,0,0,0.18)_100%)]" />

      <div className="absolute left-6 top-6 flex items-center gap-3 md:left-10 md:top-8">
        <div className="flex size-11 items-center justify-center rounded-full border border-amber-50/50 bg-white/10 text-2xl font-bold backdrop-blur-md">
          e
        </div>
        <div>
          <p className="text-lg font-semibold leading-none text-white">Elco Sage</p>
          <p className="mt-1 text-xs text-amber-50/65">Session securisee</p>
        </div>
      </div>

      <div className="absolute right-6 top-6 hidden items-center gap-3 rounded-full border border-amber-50/25 bg-white/10 px-4 py-3 text-left backdrop-blur-md md:right-10 md:top-8 md:flex">
        <div className="flex size-10 items-center justify-center rounded-full bg-amber-50/15">
          <UserRound className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="max-w-48 truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="max-w-48 truncate text-xs text-amber-50/70">{user.email}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-amber-50/15 px-2.5 py-1 text-xs font-medium text-amber-50">
          <ShieldCheck className="size-3.5" />
          {user.role}
        </div>
      </div>

      <motion.section
        className="relative flex w-full max-w-md flex-col items-center text-center"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35, ease: 'easeOut' }}
      >
        <div className="flex size-24 items-center justify-center rounded-full border-2 border-amber-50/75 bg-white/10 text-5xl font-bold shadow-2xl shadow-black/20 backdrop-blur-md">
          e
        </div>
        <p className="mt-6 text-sm text-amber-50/70">Session verrouillee</p>
        <h2 className="mt-3 text-6xl font-semibold leading-none md:text-7xl">
          {idle.formattedTime}
        </h2>
        <p className="mt-4 capitalize text-amber-50/80">{idle.formattedDate}</p>
        <p className="mt-8 text-sm text-amber-50/75">
          {isPasswordPromptVisible
            ? 'Saisissez votre mot de passe pour reprendre.'
            : 'Cliquez ou appuyez pour reprendre.'}
        </p>

        <AnimatePresence mode="wait">
          {isPasswordPromptVisible && (
            <motion.div
              className="mt-8 w-full"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-12 rounded-xl bg-white pl-10 text-neutral-950"
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
              {idle.error && <p className="mt-3 text-sm text-amber-200">{idle.error}</p>}
              <div className="mt-4 flex items-center gap-3">
                <Button
                  className="h-11 flex-1 rounded-xl bg-orange-900 text-white hover:bg-[#0c4b2b]"
                  type="button"
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
                <Button
                  className="size-11 rounded-xl border-amber-50/40 text-amber-50 hover:bg-amber-50/10"
                  type="button"
                  variant="outline"
                  aria-label="Effacer"
                  onClick={() => {
                    // Le bouton X revient a l'ecran idle simple sans deverrouiller.
                    idle.clearPasswordPrompt()
                    setIsPasswordPromptVisible(false)
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
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

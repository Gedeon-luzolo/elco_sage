import { Form } from '@adonisjs/inertia/react'
import { motion } from 'framer-motion'
import { Lock, Mail } from 'lucide-react'
import { BrandLogo } from '~/components/brand/brand_logo'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

const formItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

export default function Login() {
  return (
    <main className="flex min-h-screen w-screen items-center justify-center bg-[#031633] px-6 py-10 text-blue-50">
      <motion.section
        className="flex w-full max-w-sm flex-col items-center"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.08 },
          },
        }}
      >
        <motion.div
          className="flex size-32 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-2 shadow-2xl shadow-blue-950/30"
          variants={formItemVariants}
          transition={{ duration: 0.32, ease: 'easeOut' }}
        >
          <BrandLogo className="h-full w-full object-contain" />
        </motion.div>
        <motion.h1
          className="sr-only"
          variants={formItemVariants}
          transition={{ duration: 0.32, ease: 'easeOut' }}
        >
          Elco Sage
        </motion.h1>
        <motion.p
          className="mt-7 text-center text-sm text-blue-50/75"
          variants={formItemVariants}
          transition={{ duration: 0.32, ease: 'easeOut' }}
        >
          Gestion des ventes, du stock et des inventaires
        </motion.p>

        <Form route="session.store" className="mt-10 flex w-full flex-col gap-4">
          {({ errors, processing }) => (
            <>
              <motion.div
                variants={formItemVariants}
                transition={{ duration: 0.32, ease: 'easeOut' }}
              >
                <Label className="sr-only" htmlFor="email">
                  Adresse email
                </Label>
                <div className="relative">
                  {/* L'input garde son style shadcn, on ajoute seulement l'espace pour l'icone. */}
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-12 rounded-xl bg-white pl-10 text-neutral-950"
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Email"
                    autoComplete="email"
                    data-invalid={errors.email ? 'true' : undefined}
                    required
                  />
                </div>
                {errors.email && <p className="mt-2 text-sm text-blue-100">{errors.email}</p>}
              </motion.div>

              <motion.div
                variants={formItemVariants}
                transition={{ duration: 0.32, ease: 'easeOut' }}
              >
                <Label className="sr-only" htmlFor="password">
                  Mot de passe
                </Label>
                <div className="relative">
                  {/* Meme approche pour garder un rendu coherent avec la librairie UI. */}
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-12 rounded-xl bg-white pl-10 text-neutral-950"
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Mot de passe"
                    autoComplete="current-password"
                    data-invalid={errors.password ? 'true' : undefined}
                    required
                  />
                </div>
                {errors.password && <p className="mt-2 text-sm text-blue-100">{errors.password}</p>}
              </motion.div>

              {errors.E_INVALID_CREDENTIALS && (
                <p className="text-sm text-blue-100">{errors.E_INVALID_CREDENTIALS}</p>
              )}

              <motion.div
                variants={formItemVariants}
                transition={{ duration: 0.32, ease: 'easeOut' }}
              >
                <Button
                  type="submit"
                  disabled={processing}
                  className="mt-7 h-12 w-full rounded-xl bg-primary px-5 text-base text-primary-foreground hover:bg-blue-700"
                >
                  {processing && (
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {processing ? 'Connexion...' : 'Se connecter'}
                </Button>
              </motion.div>
            </>
          )}
        </Form>
      </motion.section>
    </main>
  )
}

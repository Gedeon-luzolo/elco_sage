import { Form } from '@adonisjs/inertia/react'
import { Lock, Mail } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

export default function Login() {
  return (
    <main className="flex min-h-screen w-screen items-center justify-center bg-[#2b1810] px-6 py-10 text-amber-50">
      <section className="flex w-full max-w-sm flex-col items-center">
        <div className="flex size-24 items-center justify-center rounded-full border-4 border-amber-50 text-5xl font-bold">
          e
        </div>
        <h1 className="mt-7 text-center text-6xl font-normal leading-none tracking-normal">
          Elco Sage
        </h1>
        <p className="mt-3 text-center text-sm text-amber-50/75">
          Gestion des ventes, du stock et des inventaires
        </p>

        <Form route="session.store" className="mt-10 flex w-full flex-col gap-4">
          {({ errors, processing }) => (
            <>
              <div>
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
                {errors.email && <p className="mt-2 text-sm text-amber-200">{errors.email}</p>}
              </div>

              <div>
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
                {errors.password && (
                  <p className="mt-2 text-sm text-amber-200">{errors.password}</p>
                )}
              </div>

              {errors.E_INVALID_CREDENTIALS && (
                <p className="text-sm text-amber-200">{errors.E_INVALID_CREDENTIALS}</p>
              )}

              <Button
                type="submit"
                disabled={processing}
                className="mt-7 h-12 rounded-none bg-orange-900 px-5 text-base text-white hover:bg-[#0c4b2b]"
              >
                {processing && (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {processing ? 'Connexion...' : 'Se connecter'}
              </Button>
            </>
          )}
        </Form>
      </section>
    </main>
  )
}

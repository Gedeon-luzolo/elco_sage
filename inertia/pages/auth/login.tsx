import { Form } from '@adonisjs/inertia/react'

export default function Login() {
  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-[#2b1810] md:flex">
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#3d2416]" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#3d2416]" />
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold tracking-wide text-amber-50">Elco Sage</h1>
          <p className="mt-3 text-sm text-amber-50/70">
            Gestion des ventes, du stock et des inventaires
          </p>
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center bg-background px-6">
        <section className="w-full max-w-md">
          <h2 className="text-4xl font-bold text-foreground">Connexion</h2>
          <p className="mt-1 text-muted-foreground">
            Entrez vos identifiants pour acceder a votre espace.
          </p>

          <Form route="session.store" className="mt-8 flex flex-col gap-4">
            {({ errors, processing }) => (
              <>
                <div>
                  <label className="sr-only" htmlFor="email">
                    Adresse email
                  </label>
                  <div className="flex h-14 items-center gap-3 rounded-xl border border-input bg-background px-4 text-muted-foreground shadow-xs transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                    <span aria-hidden="true" className="text-xl">
                      @
                    </span>
                    <input
                      className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Adresse email"
                      autoComplete="email"
                      data-invalid={errors.email ? 'true' : undefined}
                      required
                    />
                  </div>
                  {errors.email && <p className="mt-2 text-sm text-destructive">{errors.email}</p>}
                </div>

                <div>
                  <label className="sr-only" htmlFor="password">
                    Mot de passe
                  </label>
                  <div className="flex h-14 items-center gap-3 rounded-xl border border-input bg-background px-4 text-muted-foreground shadow-xs transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                    <span aria-hidden="true" className="text-xl">
                      *
                    </span>
                    <input
                      className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
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
                    <p className="mt-2 text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                {errors.E_INVALID_CREDENTIALS && (
                  <p className="text-sm text-destructive">{errors.E_INVALID_CREDENTIALS}</p>
                )}

                <button
                  type="submit"
                  disabled={processing}
                  className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2b1810] px-5 text-base font-medium text-amber-50 transition-colors hover:bg-[#3d2416] disabled:pointer-events-none disabled:opacity-50"
                >
                  {processing && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-50/40 border-t-amber-50" />
                  )}
                  {processing ? 'Connexion...' : 'Se connecter'}
                </button>
              </>
            )}
          </Form>
        </section>
      </main>
    </div>
  )
}

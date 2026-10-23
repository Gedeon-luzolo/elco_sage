import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, ArrowRight, Banknote, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { SALES_NAV_LINKS } from '~/constants/sales'
import type { InertiaProps } from '~/types'
import type { SalesPageProps } from '~/types/cash_session_types'
import { formatDateLabel } from '~/utils/date'
import { renderMoneyMap } from '~/utils/money_map.utils'
import { isManagementRole } from '~/utils/user_role.utils'

export default function SalesPage({
  currentCashSession,
  sessionTotals,
  user,
}: InertiaProps<SalesPageProps>) {
  const isManagementUser = isManagementRole(user?.role)

  // Résumé de la session ouverte : argent entré en caisse, dettes et recouvrements.
  const sessionSummary = [
    { label: 'Cash', amounts: sessionTotals?.cashAmounts },
    { label: 'Dettes', amounts: sessionTotals?.debtAmounts },
    { label: 'Recouvrements', amounts: sessionTotals?.recoveryAmounts },
  ]
  const canCreateSale = Boolean(currentCashSession && currentCashSession.userId === user?.id)

  const sessionDescription = currentCashSession?.openingDate
    ? `Session ouverte le ${formatDateLabel(currentCashSession.openingDate)} à ${
        currentCashSession.openingTime ?? '--:--'
      }.`
    : 'Aucune session de caisse ouverte.'

  // 66px retire la hauteur de l'AppBar (min-h-16 + bordure 2px) pour éviter un scroll résiduel.
  return (
    <main className="relative flex min-h-[calc(100vh-66px)] w-full justify-center overflow-hidden px-6 py-16 text-foreground">
      {/* Fond illustré : deux taches de couleur douces sur un gris neutre. */}
      <div
        className="pointer-events-none absolute inset-0 bg-muted/40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, oklch(0.9 0.05 263), transparent 60%), radial-gradient(circle at 80% 80%, oklch(0.92 0.05 20), transparent 60%)',
        }}
      />

      {isManagementUser && (
        <Button
          render={<Link href="/" />}
          variant="outline"
          size="sm"
          className="absolute top-6 right-6 bg-background/70 backdrop-blur-sm"
        >
          <ArrowLeft className="size-4" />
          Retour accueil
        </Button>
      )}

      <div className="relative flex w-full max-w-6xl flex-col items-center gap-10">
        <div className="flex w-full flex-wrap items-end justify-between gap-6">
          <div className="text-left">
            <p className="text-3xl font-semibold">Gestion des ventes</p>
            <p className="mt-2.5 text-base text-muted-foreground">{sessionDescription}</p>
          </div>

          {sessionTotals && (
            <div className="space-y-1 text-sm">
              {sessionSummary.map((item) => (
                <p key={item.label} className="text-muted-foreground">
                  {item.label} :{' '}
                  <span className="font-semibold text-foreground">
                    {renderMoneyMap(item.amounts)}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-4 sm:grid-rows-2">
          {canCreateSale ? (
            <Link
              href="/sales/create"
              className="group relative col-span-2 flex flex-col justify-end gap-6 overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary to-violet-700 p-10 text-left text-primary-foreground no-underline shadow-2xl shadow-primary/40 ring-1 ring-white/10 transition duration-300 hover:scale-[1.015] hover:shadow-primary/60 sm:row-span-2"
            >
              <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />

              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Plus className="size-7" />
              </div>

              <div className="relative flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold">Nouvelle vente</p>
                  <p className="mt-2 text-base text-primary-foreground/80">
                    Enregistrer une addition sur la session ouverte
                  </p>
                </div>
                <ArrowRight className="size-7 shrink-0 transition-transform duration-300 group-hover:translate-x-1.5" />
              </div>
            </Link>
          ) : !currentCashSession ? (
            <Link
              href="/sales/session/open"
              className="group relative col-span-2 flex flex-col justify-end gap-6 overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary to-violet-700 p-10 text-left text-primary-foreground no-underline shadow-2xl shadow-primary/40 ring-1 ring-white/10 transition duration-300 hover:scale-[1.015] hover:shadow-primary/60 sm:row-span-2"
            >
              <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />

              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Banknote className="size-7" />
              </div>

              <div className="relative flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold">Ouvrir une caisse</p>
                  <p className="mt-2 text-base text-primary-foreground/80">
                    Démarrer une nouvelle session pour encaisser
                  </p>
                </div>
                <ArrowRight className="size-7 shrink-0 transition-transform duration-300 group-hover:translate-x-1.5" />
              </div>
            </Link>
          ) : null}

          {SALES_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col items-start justify-center gap-4 rounded-2xl border border-border bg-background/70 p-8 text-foreground no-underline shadow-sm backdrop-blur-sm transition duration-300 hover:scale-[1.02] hover:border-primary/40 hover:bg-background hover:shadow-lg"
            >
              <link.icon className="size-8 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
              <div className="flex w-full items-end justify-between gap-2">
                <div>
                  <p className="text-lg font-medium">{link.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

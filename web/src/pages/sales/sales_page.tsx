import { AppLink as Link } from '~/components/common/app_link'
import { ArrowLeft, ArrowRight, Banknote, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { SALES_NAV_LINKS } from '~/constants/sales'
import { useAuth } from '~/hooks/auth/useAuth'
import { useCrud } from '~/hooks/common/useCrud'
import { useCurrentCashSession } from '~/hooks/sales/useCashSession'
import { usePendingActivity } from '~/hooks/sales/usePendingActivity'
import {
  countPendingActivity,
  EMPTY_REPORT_TOTALS,
  mergePendingTotals,
} from '~/lib/offline/pending_report'
import type { SaleReportTotals } from '~/types/cash_session_types'
import { formatDateTimeLabel } from '~/utils/date'
import { renderMoneyMap } from '~/utils/money_map.utils'
import { isManagementRole } from '~/utils/user_role.utils'
import { getUserDisplayName } from '~/utils/user.utils'

export default function SalesPage() {
  const { user } = useAuth()
  const { data: currentCashSession } = useCurrentCashSession()

  // Le résumé cash, dettes et recouvrements réutilise les totaux du rapport de la session ouverte
  const { data: sessionReport } = useCrud<Record<string, unknown>>({
    endpoint: '/cash-sessions',
  }).useGet(currentCashSession?.id ?? '', Boolean(currentCashSession))
  const serverTotals = (sessionReport?.totals as SaleReportTotals | undefined) ?? null

  // Les ventes et recouvrements faits hors ligne s'ajoutent aux totaux du serveur
  const pending = usePendingActivity(currentCashSession)
  const pendingCount = countPendingActivity(pending)
  const sessionTotals =
    serverTotals || pendingCount > 0
      ? mergePendingTotals(serverTotals ?? EMPTY_REPORT_TOTALS, pending)
      : null

  const isManagementUser = isManagementRole(user?.role)

  // Résumé de la session ouverte : argent entré en caisse, dettes et recouvrements.
  const sessionSummary = [
    { label: 'Cash', amounts: sessionTotals?.cashAmounts },
    { label: 'Dettes', amounts: sessionTotals?.debtAmounts },
    { label: 'Recouvrements', amounts: sessionTotals?.recoveryAmounts },
  ]
  // La caisse est partagée : tout utilisateur peut vendre tant qu'une session est ouverte
  const canCreateSale = Boolean(currentCashSession)

  // Action du bandeau : vendre sur la session ouverte, sinon en ouvrir une.
  const primaryAction = canCreateSale
    ? {
        href: '/sales/create',
        icon: Plus,
        title: 'Nouvelle vente',
        description: 'Enregistrer une addition sur la session ouverte',
      }
    : !currentCashSession
      ? {
          href: '/sales/session/open',
          icon: Banknote,
          title: 'Ouvrir une caisse',
          description: 'Démarrer une nouvelle session pour encaisser',
        }
      : null

  // 66px retire la hauteur de l'AppBar (min-h-16 + bordure 2px) pour éviter un scroll résiduel.
  return (
    <main className="flex min-h-[calc(100vh-66px)] w-full justify-center bg-muted/40 px-6 py-12 text-foreground">
      <div className="flex w-full max-w-6xl flex-col gap-8">
        {/* En-tête : titre et session à gauche, retour à l'accueil à droite */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold">Gestion des ventes</p>
            {currentCashSession ? (
              <p className="mt-2 text-base text-muted-foreground">
                Session ouverte le {formatDateTimeLabel(currentCashSession.openedAt)}
                {currentCashSession.openedBy && (
                  <>
                    {' '}
                    · par{' '}
                    <span className="font-semibold text-foreground">
                      {getUserDisplayName(currentCashSession.openedBy)}
                    </span>
                  </>
                )}
              </p>
            ) : (
              <p className="mt-2 text-base text-muted-foreground">
                Aucune session de caisse ouverte.
              </p>
            )}
          </div>

          {isManagementUser && (
            <Button
              render={<Link href="/" />}
              variant="outline"
              size="sm"
              className="bg-background/70 backdrop-blur-sm"
            >
              <ArrowLeft className="size-4" />
              Retour accueil
            </Button>
          )}
        </div>

        {/* Bandeau : l'action principale, avec les totaux de la session à droite */}
        {primaryAction && (
          <Link
            href={primaryAction.href}
            className="group relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary to-violet-700 px-8 py-14 text-primary-foreground no-underline shadow-2xl shadow-primary/40 ring-1 ring-white/10 transition duration-300 hover:scale-[1.01] hover:shadow-primary/60 sm:px-12"
          >
            <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-center gap-6">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <primaryAction.icon className="size-8" />
              </div>
              <div>
                <p className="text-3xl font-semibold">{primaryAction.title}</p>
                <p className="mt-1.5 text-base text-primary-foreground/80">
                  {primaryAction.description}
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-10">
              {sessionTotals && (
                <div>
                  <div className="flex flex-wrap gap-x-10 gap-y-3">
                    {sessionSummary.map((item) => (
                      <div key={item.label}>
                        <p className="text-xs tracking-wide text-primary-foreground/70 uppercase">
                          {item.label}
                        </p>
                        <p className="mt-1 text-lg font-semibold">{renderMoneyMap(item.amounts)}</p>
                      </div>
                    ))}
                  </div>
                  {/* Les montants incluent des opérations que le serveur ne connaît pas encore */}
                  {pendingCount > 0 && (
                    <p className="mt-2 text-xs text-amber-200">
                      Dont {pendingCount} opération(s) hors ligne, pas encore envoyée(s).
                    </p>
                  )}
                </div>
              )}
              <ArrowRight className="size-7 shrink-0 transition-transform duration-300 group-hover:translate-x-1.5" />
            </div>
          </Link>
        )}

        {/* Barre d'outils : les destinations secondaires sur une seule rangée */}
        <nav className="grid grid-cols-2 border-y border-border sm:grid-cols-5 sm:divide-x sm:divide-border">
          {SALES_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col items-center gap-2.5 px-4 py-7 text-center text-foreground no-underline transition-colors duration-200 hover:bg-background/70"
            >
              <link.icon className="size-7 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
              <span className="text-base font-semibold">{link.title}</span>
              <span className="text-sm text-muted-foreground">{link.description}</span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  )
}

import { useNavigate } from 'react-router-dom'
import { AppLink as Link } from '~/components/common/app_link'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Banknote, CalendarDays, Clock, LogIn, User } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { useAuth } from '~/hooks/auth/useAuth'
import { useCrud } from '~/hooks/common/useCrud'
import { useCurrentCashSession } from '~/hooks/sales/useCashSession'
import type { CashSessionItem } from '~/types/cash_session_types'
import { formatLongDate, formatShortTime } from '~/utils/date'

export default function CashSessionOpeningPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: currentCashSession } = useCurrentCashSession()
  const openSession = useCrud<CashSessionItem>({
    endpoint: '/cash-sessions',
    showSuccessToast: false,
  }).useCreate<undefined, unknown>()

  const now = new Date()
  const openingDateLabel = formatLongDate(now)
  const openingTimeLabel = formatShortTime(now)

  return (
    <main className="flex min-h-screen items-start justify-start bg-background p-4 text-foreground sm:p-6">
      <Card className="w-full max-w-md rounded-2xl border-border bg-card shadow-md">
        <CardContent className="flex flex-col items-center gap-8 px-6 py-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Banknote className="size-7" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-normal">Ouverture de session</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Demarrez votre session avant les operations de vente.
              </p>
            </div>
          </div>

          {user && (
            <div className="flex max-w-full items-center gap-2 text-sm text-muted-foreground">
              <User className="size-4 shrink-0" />
              <span className="truncate font-medium text-foreground">{user.fullName}</span>
              <span aria-hidden="true">.</span>
              <span className="shrink-0">{user.role}</span>
            </div>
          )}

          <div className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="size-4" />
                Date d&apos;ouverture
              </div>
              <p className="mt-2 text-sm font-medium">
                {currentCashSession
                  ? formatLongDate(new Date(currentCashSession.openedAt))
                  : openingDateLabel}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-3 text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-4" />
                Heure
              </div>
              <p className="mt-2 text-sm font-medium">
                {currentCashSession
                  ? formatShortTime(new Date(currentCashSession.openedAt))
                  : openingTimeLabel}
              </p>
            </div>
          </div>

          <div className="w-full">
            {currentCashSession ? (
              <div className="flex flex-col gap-5">
                {/* Chaque vendeur a une seule session ouverte à la fois : la sienne */}
                <p className="text-sm text-muted-foreground">
                  Votre session est déjà ouverte. Continuez dessus ou fermez-la avant d&apos;en
                  ouvrir une nouvelle.
                </p>
                <Button render={<Link href="/sales" />} className="h-12 w-full rounded-xl">
                  <ArrowRight className="size-4" />
                  Continuer
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {/* Retour à l'accueil des ventes sans ouvrir de session */}
                <Button
                  render={<Link href="/sales" />}
                  variant="outline"
                  className="size-12 shrink-0 rounded-xl"
                  aria-label="Retour"
                  title="Retour"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-xl"
                  disabled={openSession.isPending}
                  onClick={() =>
                    openSession.mutate(undefined, {
                      onSuccess: () => {
                        toast.success('Session de caisse ouverte avec succès.')
                        navigate('/sales')
                      },
                    })
                  }
                >
                  <LogIn className="size-4" />
                  {openSession.isPending ? 'Ouverture...' : 'Ouvrir la session'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

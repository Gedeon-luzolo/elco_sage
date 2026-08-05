import { Form, Link } from '@adonisjs/inertia/react'
import { ArrowRight, Banknote, CalendarDays, Clock, LogIn, User } from 'lucide-react'
import { SubmitButton } from '~/components/common/submit_button'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { InertiaProps } from '~/types'
import type { CashSessionOpeningPageProps } from '~/types/cash_session_types'
import { CURRENCY_OPTIONS, Currency } from '~/utils/currency'
import { formatLongDate, formatShortTime } from '~/utils/date'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

export default function CashSessionOpeningPage({
  currentCashSession,
  user,
}: InertiaProps<CashSessionOpeningPageProps>) {
  const now = new Date()
  const openingDateLabel = formatLongDate(now)
  const openingTimeLabel = formatShortTime(now)

  return (
    <main className="flex min-h-screen items-start justify-start bg-background p-4 text-foreground sm:p-6">
      <Card className="w-full max-w-md rounded-2xl border-border bg-card shadow-md">
        <CardContent className="flex flex-col items-center gap-8 px-6 py-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#2b1810] text-amber-50">
              <Banknote className="size-7" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-normal">Ouverture de caisse</h1>
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
                Date d'ouverture
              </div>
              <p className="mt-2 text-sm font-medium">
                {currentCashSession?.openingDate ?? openingDateLabel}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-3 text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-4" />
                Heure
              </div>
              <p className="mt-2 text-sm font-medium">
                {currentCashSession?.openingTime ?? openingTimeLabel}
              </p>
            </div>
          </div>

          <div className="w-full">
            {currentCashSession ? (
              <div className="flex flex-col gap-5">
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-left">
                  <p className="text-xs text-muted-foreground">Montant d'ouverture</p>
                  <p className="mt-2 text-lg font-semibold">
                    {formatMoneyWithCurrency(
                      currentCashSession.openingAmount,
                      currentCashSession.openingCurrency as Currency
                    )}
                  </p>
                </div>

                <Button render={<Link href="/sales" />} className="h-12 w-full rounded-xl">
                  <ArrowRight className="size-4" />
                  Continuer
                </Button>
              </div>
            ) : (
              <Form route="sales.cash_sessions.store" className="flex flex-col gap-5">
                {({ errors }) => (
                  <>
                    <div className="grid gap-3 text-left">
                      <Label htmlFor="openingAmount">Somme d'ouverture</Label>
                      <div className="grid grid-cols-[1fr_96px] gap-2">
                        <Input
                          id="openingAmount"
                          name="openingAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          className="h-12 rounded-xl"
                          data-invalid={errors.openingAmount ? 'true' : undefined}
                        />
                        <Select
                          id="openingCurrency"
                          name="openingCurrency"
                          items={CURRENCY_OPTIONS}
                          defaultValue={Currency.CDF}
                        >
                          <SelectTrigger className="h-12 w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(errors.openingAmount || errors.openingCurrency) && (
                        <p className="text-sm text-destructive">
                          {errors.openingAmount ?? errors.openingCurrency}
                        </p>
                      )}
                    </div>

                    <SubmitButton
                      label="Ouvrir la caisse"
                      loadingLabel="Ouverture..."
                      icon={<LogIn className="size-4" />}
                      className="h-12 w-full rounded-xl"
                    />
                  </>
                )}
              </Form>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

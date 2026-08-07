import type { ReactNode } from 'react'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'
import type { CashSessionItem } from '~/types/cash_session_types'
import { formatDateTimeLabel } from '~/utils/date'
import { renderMoneyMap } from '~/utils/money_map.utils'

interface CashSessionCardProps {
  session: CashSessionItem
  selected: boolean
  onSelect: () => void
}

export function CashSessionCard({ session, selected, onSelect }: CashSessionCardProps) {
  const isOpen = session.status === 'OPEN'

  return (
    <button type="button" className="h-full text-left" onClick={onSelect}>
      <Card
        size="sm"
        className={cn(
          'h-full gap-3 rounded-lg border bg-background py-3 transition hover:border-primary/50 hover:shadow-sm',
          selected && 'border-primary ring-2 ring-primary/15'
        )}
      >
        <CardHeader className="gap-2 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate text-sm font-semibold">
                {session.userName ?? 'Utilisateur'}
              </CardTitle>
              <CardDescription className="truncate text-xs">
                {formatDateTimeLabel(session.openedAt)}
              </CardDescription>
            </div>
            <Badge
              className={cn(
                'h-5 px-2 text-[11px] text-white',
                isOpen ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-500 hover:bg-slate-600'
              )}
            >
              {isOpen ? 'Ouverte' : 'Fermée'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 px-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <SessionMetric label="Système" value={renderMoneyMap(session.systemAmounts)} />
            <SessionMetric label="Clôture" value={renderMoneyMap(session.closingAmounts)} />
            <SessionMetric label="Écart" value={renderMoneyMap(session.differenceAmounts)} />
            <SessionMetric label="Fermeture" value={formatDateTimeLabel(session.closedAt)} />
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

export function CashSessionCardSkeleton() {
  return (
    <Card size="sm" className="h-full gap-3 rounded-lg border bg-background py-3">
      <CardHeader className="gap-2 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 px-4">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-md bg-muted/40 px-2 py-1.5">
              <Skeleton className="mb-1 h-3 w-14 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SessionMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/40 px-2 py-1.5">
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <div className="truncate text-xs font-semibold">{value}</div>
    </div>
  )
}

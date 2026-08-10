import type { ReactNode } from 'react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'
import type { CashSessionItem } from '~/types/cash_session_types'
import { formatDateTimeLabel } from '~/utils/date'
import { renderMoneyMap } from '~/utils/money_map.utils'

interface CashSessionCardProps {
  session: CashSessionItem
  onSelect: () => void
}

export function CashSessionCard({ session, onSelect }: CashSessionCardProps) {
  const isOpen = session.status === 'OPEN'

  return (
    <Card
      size="sm"
      className="h-full gap-3 rounded-lg border bg-background py-3 transition hover:border-primary/50 hover:shadow-sm"
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
        <Button type="button" size="sm" variant="outline" className="w-full" onClick={onSelect}>
          Voir les détails
        </Button>
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

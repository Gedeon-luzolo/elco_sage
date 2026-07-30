import { type Data } from '@generated/data'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { formatLongDate, formatShortTime } from '~/utils/date'
import { numberFormatter } from '~/utils/format_number.utils'

type ExchangeRateHistory = Data.ExchangeRate.Variants['toHistory']

interface ExchangeRateHistoryTableProps {
  exchangeRates: ExchangeRateHistory[]
}

// Affiche les dernieres modifications du taux USD/CDF.
export function ExchangeRateHistoryTable({ exchangeRates }: ExchangeRateHistoryTableProps) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>Historique</CardTitle>
        <CardDescription>Les vingt dernieres modifications du taux USD/CDF.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Achat</TableHead>
              <TableHead>Vente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exchangeRates.map((exchangeRate, index) => {
              const createdAt = new Date(exchangeRate.createdAt)

              return (
                <TableRow key={exchangeRate.id}>
                  <TableCell>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <span>{formatLongDate(createdAt)}</span>
                        {index === 0 && <Badge variant="secondary">Actuel</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatShortTime(createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {numberFormatter.format(exchangeRate.usdToCdfBuyRate)} CDF
                  </TableCell>
                  <TableCell className="font-medium">
                    {numberFormatter.format(exchangeRate.usdToCdfSellRate)} CDF
                  </TableCell>
                </TableRow>
              )
            })}

            {exchangeRates.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Aucun taux enregistre.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

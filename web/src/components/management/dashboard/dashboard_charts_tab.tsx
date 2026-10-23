import { CircleDollarSign, Package } from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'
import { EmptyState } from '~/components/common/empty_state'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { TabsContent } from '~/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type { DashboardStats, DashboardTopService } from '~/types/dashboard_types'
import { formatMoneyWithCurrency, formatNumber } from '~/utils/format_number.utils'
import { renderMoneyMap, type MoneyMap } from '~/utils/money_map.utils'

const amountChartColors = {
  theoretical: '#2563eb',
  offered: '#8b5cf6',
  real: '#16a34a',
  discount: '#f97316',
  cash: '#0d9488',
  debt: '#dc2626',
  recovery: '#f59e0b',
}

interface DashboardChartsTabProps {
  stats: DashboardStats
  topServices: DashboardTopService[]
}

/**
 * Regroupe les graphiques du dashboard.
 * Les visualisations de cet onglet utilisent uniquement les montants en FC.
 */
export function DashboardChartsTab({ stats, topServices }: DashboardChartsTabProps) {
  const amountChartData = [
    {
      key: 'theoretical',
      label: 'Théorique',
      amounts: stats.theoreticalAmounts,
      value: getMoneyMapCdfValue(stats.theoreticalAmounts),
      fill: amountChartColors.theoretical,
    },
    {
      key: 'offered',
      label: 'Offerts',
      amounts: stats.offeredAmounts,
      value: getMoneyMapCdfValue(stats.offeredAmounts),
      fill: amountChartColors.offered,
    },
    {
      key: 'real',
      label: 'Réel',
      amounts: stats.realAmounts,
      value: getMoneyMapCdfValue(stats.realAmounts),
      fill: amountChartColors.real,
    },
    {
      key: 'discount',
      label: 'Remise',
      amounts: stats.discountAmounts,
      value: getMoneyMapCdfValue(stats.discountAmounts),
      fill: amountChartColors.discount,
    },
    {
      key: 'cash',
      label: 'Cash',
      amounts: stats.cashAmounts,
      value: getMoneyMapCdfValue(stats.cashAmounts),
      fill: amountChartColors.cash,
    },
    {
      key: 'debt',
      label: 'Dettes',
      amounts: stats.remainingDebtAmounts,
      value: getMoneyMapCdfValue(stats.remainingDebtAmounts),
      fill: amountChartColors.debt,
    },
    {
      key: 'recovery',
      label: 'Recouvrement',
      amounts: stats.recoveryAmounts,
      value: getMoneyMapCdfValue(stats.recoveryAmounts),
      fill: amountChartColors.recovery,
    },
  ]

  const visibleAmountChartData = amountChartData.filter((item) => item.value > 0)
  const maxTopServiceValue = Math.max(...topServices.map(getTopServiceCdfValue), 1)

  return (
    <TabsContent value="charts">
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted">
                <CircleDollarSign className="size-5" />
              </span>
              <div>
                <CardTitle>Répartition financière</CardTitle>
                <CardDescription>Vue circulaire des montants clés en FC.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {visibleAmountChartData.length === 0 ? (
              <EmptyState
                icon={CircleDollarSign}
                title="Aucun montant"
                description="Aucun montant en FC ne correspond à cette période."
                className="border-none bg-transparent shadow-none"
              />
            ) : (
              <div className="grid gap-5 lg:grid-cols-[minmax(200px,0.8fr)_minmax(260px,1fr)] lg:items-center">
                <ChartContainer
                  config={{ value: { label: 'Montant FC' } }}
                  className="mx-auto h-60 max-w-70"
                >
                  <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={visibleAmountChartData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={54}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {visibleAmountChartData.map((item) => (
                        <Cell key={item.key} fill={item.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                <div className="grid gap-2">
                  {amountChartData.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-sm"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-right font-medium">
                        {formatMoneyWithCurrency(getMoneyMapCdfValue(item.amounts), 'CDF')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted">
                <Package className="size-5" />
              </span>
              <div>
                <CardTitle>Top 15 services</CardTitle>
                <CardDescription>Meilleurs services par valeur vendue</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucun service vendu"
                description="Aucune ligne de vente ne correspond à cette période."
                className="border-none bg-transparent shadow-none"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Services</TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topServices.map((service) => {
                    const value = getTopServiceCdfValue(service)
                    const width = `${Math.max(8, (value / maxTopServiceValue) * 100)}%`

                    return (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="relative min-w-48 overflow-hidden rounded-md py-1.5">
                            <span
                              className="absolute inset-y-0 left-0 rounded-md bg-blue-100 dark:bg-blue-900/30"
                              style={{ width }}
                            />
                            <span className="relative font-medium">{service.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(service.quantity)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {renderMoneyMap({
                            CDF: service.amountCdf,
                            USD: service.amountUsd,
                          })}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </TabsContent>
  )
}

function getMoneyMapCdfValue(amounts: MoneyMap) {
  return Number(amounts.CDF || 0)
}

function getTopServiceCdfValue(service: DashboardTopService) {
  return Number(service.amountCdf || 0)
}

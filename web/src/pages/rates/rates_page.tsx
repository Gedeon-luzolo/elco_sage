import { ArrowDownToLine, ArrowUpFromLine, Banknote } from 'lucide-react'
import { ExchangeRateForm } from '~/components/exchange/exchange_rate_form'
import { ExchangeRateHistoryTable } from '~/components/exchange/exchange_rate_history_table'
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { PageHeader } from '~/components/common/page_header'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { ManagementLayout } from '~/layouts/management_layout'
import { useCrud } from '~/hooks/common/useCrud'
import type { ExchangeRateDTO } from '~/types/dto'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

const EMPTY_RATES: Required<ExchangeRateDTO>[] = []

export default function RatesPage() {
  // Le taux courant est la ligne la plus recente de l'historique.
  const { useListWithParams, useCreate } = useCrud<Required<ExchangeRateDTO>>({
    endpoint: '/exchange-rates',
    invalidateQueries: ['/product-services'],
  })
  const { data } = useListWithParams({ limit: 20 })
  const exchangeRates = data ?? EMPTY_RATES
  const createRate = useCreate<{ exchangeRate: number; sellRate: number }, void>()
  const currentRate = exchangeRates[0]

  // Enregistre une nouvelle ligne pour conserver l'historique des taux.
  const saveRate = (formData: FormData) => {
    createRate.mutate({
      exchangeRate: Number(formData.get('exchangeRate')),
      sellRate: Number(formData.get('sellRate')),
    })
  }

  return (
    <ManagementLayout title="Gestion des taux">
      <section className="flex w-full flex-col gap-6">
        <PageHeader
          title="Gestion des taux"
          description="Definir les taux USD vers CDF utilises dans toute l'application."
          icon={Banknote}
          accentClassName={MODULE_HEADER_ACCENTS.management}
        />

        <section className="grid gap-3 sm:grid-cols-2">
          <Card size="sm" className="bg-background">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <ArrowDownToLine className="size-4" />
                </span>
                <div>
                  <CardDescription>Taux d&apos;échange actuel</CardDescription>
                  <CardTitle className="mt-1 text-2xl">
                    {currentRate
                      ? `${formatMoneyWithCurrency(currentRate.exchangeRate, 'CDF')}`
                      : 'Non defini'}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card size="sm" className="bg-background">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <ArrowUpFromLine className="size-4" />
                </span>
                <div>
                  <CardDescription>Taux de vente actuel</CardDescription>
                  <CardTitle className="mt-1 text-2xl">
                    {currentRate
                      ? `${formatMoneyWithCurrency(currentRate.sellRate, 'CDF')}`
                      : 'Non defini'}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <ExchangeRateForm action={saveRate} isPending={createRate.isPending} />
          <ExchangeRateHistoryTable exchangeRates={exchangeRates} />
        </section>
      </section>
    </ManagementLayout>
  )
}

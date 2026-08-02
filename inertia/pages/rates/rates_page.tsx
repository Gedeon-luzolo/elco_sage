import { router, usePage } from '@inertiajs/react'
import { ArrowDownToLine, ArrowUpFromLine, Banknote } from 'lucide-react'
import { type Data } from '@generated/data'
import { ExchangeRateForm } from '~/components/exchange/exchange_rate_form'
import { ExchangeRateHistoryTable } from '~/components/exchange/exchange_rate_history_table'
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { PageHeader } from '~/components/common/page_header'
import { ManagementLayout } from '~/layouts/management_layout'
import type { InertiaProps } from '~/types'
import { numberFormatter } from '~/utils/format_number.utils'

type ExchangeRateHistory = Data.ExchangeRate.Variants['toHistory']

interface RatesPageProps {
  exchangeRates: ExchangeRateHistory[]
}

export default function RatesPage({ exchangeRates }: RatesPageProps) {
  const { errors } = usePage<InertiaProps>().props
  const currentRate = exchangeRates[0]

  // Enregistre une nouvelle ligne pour conserver l'historique des taux.
  const saveRate = (formData: FormData) => {
    router.post(
      '/management/rates',
      {
        usdToCdfBuyRate: Number(formData.get('usdToCdfBuyRate')),
        usdToCdfSellRate: Number(formData.get('usdToCdfSellRate')),
      },
      { preserveScroll: true }
    )
  }

  return (
    <ManagementLayout title="Gestion des taux">
      <section className="flex w-full flex-col gap-6">
        <PageHeader
          title="Gestion des taux"
          description="Definir les taux USD vers CDF utilises dans toute l'application."
          icon={Banknote}
        />

        <section className="grid gap-3 sm:grid-cols-2">
          <Card size="sm" className="bg-background">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <ArrowDownToLine className="size-4" />
                </span>
                <div>
                  <CardDescription>Taux d&apos;achat actuel</CardDescription>
                  <CardTitle className="mt-1 text-2xl">
                    {currentRate
                      ? `${numberFormatter.format(currentRate.usdToCdfBuyRate)} CDF`
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
                      ? `${numberFormatter.format(currentRate.usdToCdfSellRate)} CDF`
                      : 'Non defini'}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <ExchangeRateForm
            action={saveRate}
            errors={errors}
            currentBuyRate={currentRate?.usdToCdfBuyRate}
            currentSellRate={currentRate?.usdToCdfSellRate}
          />
          <ExchangeRateHistoryTable exchangeRates={exchangeRates} />
        </section>
      </section>
    </ManagementLayout>
  )
}

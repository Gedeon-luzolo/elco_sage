import { Link } from '@adonisjs/inertia/react'
import { Banknote, CreditCard, Eye, Plus, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { SaleDetailPanel } from '~/components/sales/sale_detail_panel'
import { SalesTable } from '~/components/sales/sales_table'
import { Button } from '~/components/ui/button'
import type { InertiaProps } from '~/types'
import type { SalesPageProps } from '~/types/cash_session_types'
import { formatDateLabel } from '~/utils/date'

export default function SalesPage({ currentCashSession, sales }: InertiaProps<SalesPageProps>) {
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(sales[0]?.id ?? null)

  // La description de la page depend de l'etat de la session courante.
  const pageDescription = currentCashSession?.openingDate
    ? `Session ouverte le ${formatDateLabel(currentCashSession.openingDate)} a ${
        currentCashSession.openingTime ?? '--:--'
      }.`
    : 'Lecture des ventes enregistrees dans la session de caisse courante.'

  // La ligne selectionnee alimente le panneau de details.
  const selectedSale = useMemo(
    () => sales.find((sale) => sale.id === selectedSaleId) ?? null,
    [sales, selectedSaleId]
  )

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <section className="flex w-full flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader title="Gestion des ventes" description={pageDescription} icon={ShoppingCart}>
          <>
            <Button className="bg-red-800 text-white hover:bg-red-500/80 hover:text-white" render={<Link href="/sales/debts" />} variant="outline">
              <CreditCard className="size-4" />
              Credits
            </Button>
            {currentCashSession ? (
              <Button render={<Link href="/sales/create" />}>
                <Plus className="size-4" />
                Nouvelle vente
              </Button>
            ) : (
              <Button render={<Link href="/sales/session/open" />} variant="outline">
                <Banknote className="size-4" />
                Ouvrir une caisse
              </Button>
            )}
          </>
        </PageHeader>

        {!currentCashSession ? (
          <EmptyState
            icon={Banknote}
            title="Aucune caisse ouverte"
            description="Ouvrez une session de caisse pour consulter les ventes de votre session."
          />
        ) : sales.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="Aucune vente dans cette session"
            description="Les ventes enregistrees pendant cette session apparaitront ici."
          />
        ) : (
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(540px,620px)]">
            <SalesTable
              sales={sales}
              selectedSaleId={selectedSaleId}
              onSelectSale={setSelectedSaleId}
            />
            {selectedSale && <SaleDetailPanel sale={selectedSale} />}
          </div>
        )}
      </section>
    </main>
  )
}

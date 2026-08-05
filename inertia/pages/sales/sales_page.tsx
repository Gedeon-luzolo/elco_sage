import { Link } from '@adonisjs/inertia/react'
import { Banknote, Plus, ShoppingCart } from 'lucide-react'
import { PageHeader } from '~/components/common/page_header'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import type { InertiaProps } from '~/types'
import type { SalesPageProps } from '~/types/cash_session_types'

export default function SalesPage({ currentCashSession }: InertiaProps<SalesPageProps>) {
  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader
          title="Gestion des ventes"
          description="Suivi des ventes et des operations de caisse."
          icon={ShoppingCart}
        >
          {currentCashSession ? (
            <Button type="button" disabled>
              <Plus className="size-4" />
              Nouvelle vente
            </Button>
          ) : (
            <Button render={<Link href="/sales/session/open" />} variant="outline">
              <Banknote className="size-4" />
              Ouvrir une caisse
            </Button>
          )}
        </PageHeader>

        <Card>
          <p>Bientot disponible</p>
        </Card>
      </section>
    </main>
  )
}

import { router } from '@inertiajs/react'
import { ArrowLeft, Plus, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { StatCard } from '~/components/common/stat_card'
import { CustomerCard } from '~/components/customers/customer_card'
import { CustomerDialog } from '~/components/customers/customer_dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { CustomerItem, CustomersPageProps } from '~/types/customer_types'
import { StatusFilter, matchesStatusFilter } from '~/utils/status.utils'

export default function CustomersPage({ customers, stats }: CustomersPageProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.ALL)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null)

  // Prepare les cartes de statistiques affichees en haut de page.
  const statCards = [
    { label: 'Total customers', value: stats.total, className: '' },
    {
      label: 'Actifs',
      value: stats.activeCount,
      className:
        'border-emerald-200/50 dark:border-emerald-950 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Inactifs',
      value: stats.inactiveCount,
      className: 'border-amber-200/50 dark:border-amber-950 text-amber-600 dark:text-amber-400',
    },
  ]

  // Filtre les customers selon la recherche et le statut.
  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase()

    return customers.filter((customer) => {
      const matchesSearch =
        customer.fullName.toLowerCase().includes(term) ||
        (customer.phoneNumber ?? '').toLowerCase().includes(term) ||
        (customer.email ?? '').toLowerCase().includes(term)
      const matchesStatus = matchesStatusFilter(customer.isActive, statusFilter)

      return matchesSearch && matchesStatus
    })
  }, [customers, search, statusFilter])

  // Ferme toutes les fenetres apres succes ou annulation.
  const closeDialog = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
  }

  // Ouvre le modal en mode creation.
  const openCreateModal = () => {
    setEditingCustomer(null)
    setIsModalOpen(true)
  }

  // Ouvre le modal en mode edition.
  const openEditModal = (customer: CustomerItem) => {
    setEditingCustomer(customer)
    setIsModalOpen(true)
  }

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader
          title="Gestion des clients"
          description="Creez les fiches clients et gardez une trace de leur statut."
          icon={Users}
        >
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.visit('/')}>
              <ArrowLeft className="size-4" />
              Retour
            </Button>
            <Button type="button" onClick={openCreateModal}>
              <Plus className="size-4" />
              Nouveau client
            </Button>
          </div>
        </PageHeader>

        {/* Cartes de statistiques */}
        <section className="grid grid-cols-3 gap-3">
          {statCards.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              className={stat.className}
              labelClassName={stat.className}
              valueClassName={stat.className}
            />
          ))}
        </section>

        {/* Barre de recherche et filtres de statut */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un customer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 pl-9"
            />
          </div>

          {/* Filtres rapides par statut */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={statusFilter === StatusFilter.ALL ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(StatusFilter.ALL)}
            >
              Tous ({customers.length})
            </Button>
            <Button
              type="button"
              variant={statusFilter === StatusFilter.ACTIVE ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(StatusFilter.ACTIVE)}
            >
              Actifs ({stats.activeCount})
            </Button>
            <Button
              type="button"
              variant={statusFilter === StatusFilter.INACTIVE ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(StatusFilter.INACTIVE)}
            >
              Inactifs ({stats.inactiveCount})
            </Button>
          </div>
        </div>

        {/* Cartes des customers */}
        {filteredCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client trouve"
            description="Il n'y a aucun client correspondant a votre recherche ou aucun enregistrement n'existe encore."
            className="border-none bg-transparent shadow-none"
          />
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} onEdit={openEditModal} />
            ))}
          </section>
        )}
      </section>

      {/* Modal creation / edition */}
      <CustomerDialog
        title={editingCustomer ? 'Modifier le client' : 'Nouveau client'}
        description={
          editingCustomer
            ? 'Mettez a jour les informations principales du client.'
            : 'Enregistrez les informations principales du client.'
        }
        open={isModalOpen}
        customer={editingCustomer}
        submitLabel={editingCustomer ? 'Enregistrer' : 'Creer'}
        onOpenChange={(open) => {
          if (!open) closeDialog()
          else setIsModalOpen(true)
        }}
      />
    </main>
  )
}

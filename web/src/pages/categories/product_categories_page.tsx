import { Plus, Tags } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CategoryCard } from '~/components/categories/category_card'
import { ProductCategoryModal } from '~/components/categories/product_category_modal'
import { Button } from '~/components/ui/button'
import { StatCard } from '~/components/common/stat_card'
import { PageHeader } from '~/components/common/page_header'
import { EmptyState } from '~/components/common/empty_state'
import { SearchInput } from '~/components/common/search_input'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { useSearch } from '~/hooks/use_search'
import { ManagementLayout } from '~/layouts/management_layout'
import { useCrud } from '~/hooks/common/useCrud'
import type {
  ProductCategoryItem,
  ProductCategoriesPageProps,
  ProductCategoryStats,
} from '~/types/product_category_types'
import { StatusFilter, matchesStatusFilter } from '~/utils/status.utils'
import { fieldFormData } from '~/utils/form.utils'

const EMPTY_CATEGORIES: ProductCategoryItem[] = []
const EMPTY_STATS: ProductCategoryStats = { total: 0, activeCount: 0, inactiveCount: 0 }

export default function ProductCategoriesPage() {
  // Les articles affichent le nom de leur catégorie : on invalide aussi le catalogue
  const { useGetWithParams, useCreate, usePatch } = useCrud<ProductCategoriesPageProps>({
    endpoint: '/product-categories',
    invalidateQueries: ['/product-services'],
  })
  const { data } = useGetWithParams()
  const categories = data?.categories ?? EMPTY_CATEGORIES
  const stats = data?.stats ?? EMPTY_STATS
  const createCategory = useCreate<{ name: string }>()
  const updateCategory = usePatch<{ name: string; isActive: boolean }>()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.ALL)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategoryItem | null>(null)
  const {
    search,
    setSearch,
    filteredItems: searchedCategories,
  } = useSearch({
    items: categories,
    fields: ['name'],
  })

  // Dérivé directement des props : ne change qu'après une action serveur.
  const statCards = [
    { label: 'Total Catégories', value: stats.total, className: '' },
    {
      label: 'Actives',
      value: stats.activeCount,
      className:
        'border-emerald-200/50 dark:border-emerald-950 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Inactives',
      value: stats.inactiveCount,
      className: 'border-amber-200/50 dark:border-amber-950 text-amber-600 dark:text-amber-400',
    },
  ]

  // Filtre les catégories selon la recherche textuelle et le filtre de statut actif.
  const filteredCategories = useMemo(
    () =>
      searchedCategories.filter((category) => matchesStatusFilter(category.isActive, statusFilter)),
    [searchedCategories, statusFilter]
  )

  // Ouvre le modal en mode création avec un formulaire vierge.
  const openCreateModal = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  // Ouvre le même modal en mode édition pré-rempli avec les valeurs de la catégorie.
  const openEditModal = (cat: ProductCategoryItem) => {
    setEditingCategory(cat)
    setIsModalOpen(true)
  }

  // Réinitialise toutes les modales après succès ou annulation.
  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  // Envoie le formulaire vers la création ou la modification selon le mode courant.
  const saveCategory = (formData: FormData) => {
    const options = { onSuccess: closeModal }

    if (editingCategory) {
      // En édition, isActive est présent dans le form et explicitement envoyé.
      const payload = {
        name: fieldFormData('name', formData) ?? '',
        isActive: formData.get('isActive') === 'true',
      }
      updateCategory.mutate({ id: editingCategory.id, data: payload }, options)
    } else {
      // En création, isActive est absent du form — le backend le fixe à true par défaut.
      const payload = {
        name: fieldFormData('name', formData) ?? '',
      }
      createCategory.mutate(payload, options)
    }
  }

  return (
    <ManagementLayout title="Catégories des produits & Services">
      <section className="flex w-full flex-col gap-6">
        <PageHeader
          title="Catégories des produits & Services"
          description="Organisez les différents produits et services proposés par votre imprimerie."
          icon={Tags}
          accentClassName={MODULE_HEADER_ACCENTS.management}
        >
          <Button type="button" onClick={openCreateModal}>
            <Plus className="size-4" />
            Nouvelle catégorie
          </Button>
        </PageHeader>

        {/* Cartes de statistiques */}
        <section className="grid gap-3 md:grid-cols-3 grid-cols-3">
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
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher une catégorie..."
          />

          {/* Filtres rapides par statut */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={statusFilter === StatusFilter.ALL ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(StatusFilter.ALL)}
            >
              Toutes ({categories.length})
            </Button>
            <Button
              type="button"
              variant={statusFilter === StatusFilter.ACTIVE ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(StatusFilter.ACTIVE)}
            >
              Actives ({stats.activeCount})
            </Button>
            <Button
              type="button"
              variant={statusFilter === StatusFilter.INACTIVE ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(StatusFilter.INACTIVE)}
            >
              Inactives ({stats.inactiveCount})
            </Button>
          </div>
        </div>

        {/* Catégories en cartes, au même format que les produits et services */}
        {filteredCategories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Aucune catégorie trouvée"
            description="Il n'y a aucune catégorie correspondant à votre recherche ou aucun enregistrement n'existe encore."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} onEdit={openEditModal} />
            ))}
          </div>
        )}
      </section>

      {/* Modal Création / Édition */}
      <ProductCategoryModal
        title={editingCategory ? 'Modifier la catégorie' : 'Créer une catégorie'}
        description={
          editingCategory
            ? 'Mettez à jour les informations de cette catégorie.'
            : "Ajoutez une nouvelle catégorie pour organiser les services d'imprimerie."
        }
        open={isModalOpen}
        category={editingCategory}
        submitLabel={editingCategory ? 'Enregistrer' : 'Créer'}
        onOpenChange={(open) => {
          if (!open) closeModal()
          else setIsModalOpen(true)
        }}
        action={saveCategory}
      />
    </ManagementLayout>
  )
}

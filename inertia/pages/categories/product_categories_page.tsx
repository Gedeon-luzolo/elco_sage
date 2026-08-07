import { router } from '@inertiajs/react'
import { CheckCircle2, Edit2, Plus, Tags, Trash2, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductCategoryModal } from '~/components/categories/product_category_modal'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { ConfirmationDialog } from '~/components/ui/confirmation_dialog'
import { StatCard } from '~/components/common/stat_card'
import { PageHeader } from '~/components/common/page_header'
import { EmptyState } from '~/components/common/empty_state'
import { SearchInput } from '~/components/common/search_input'
import { useSearch } from '~/hooks/use_search'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { ManagementLayout } from '~/layouts/management_layout'
import type {
  ProductCategoryItem,
  ProductCategoriesPageProps,
} from '~/types/product_category_types'
import { formatShortDate } from '~/utils/date'
import { StatusFilter, matchesStatusFilter } from '~/utils/status.utils'

export default function ProductCategoriesPage({ categories, stats }: ProductCategoriesPageProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.ALL)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategoryItem | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<ProductCategoryItem | null>(null)
  const {
    search,
    setSearch,
    filteredItems: searchedCategories,
  } = useSearch({
    items: categories,
    fields: ['name', 'description'],
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
    setDeletingCategory(null)
  }

  // Envoie le formulaire vers la création ou la modification selon le mode courant.
  const saveCategory = (formData: FormData) => {
    const options = { preserveScroll: true, onSuccess: closeModal }

    if (editingCategory) {
      // En édition, isActive est présent dans le form et explicitement envoyé.
      const payload = {
        name: String(formData.get('name') || ''),
        description: String(formData.get('description') || ''),
        isActive: formData.get('isActive') === 'true',
      }
      router.put(`/management/product-categories/${editingCategory.id}`, payload, options)
    } else {
      // En création, isActive est absent du form — le backend le fixe à true par défaut.
      const payload = {
        name: String(formData.get('name') || ''),
        description: String(formData.get('description') || ''),
      }
      router.post('/management/product-categories', payload, options)
    }
  }

  // Supprime la catégorie après confirmation explicite de l'utilisateur.
  const confirmDelete = () => {
    if (!deletingCategory) return

    router.delete(`/management/product-categories/${deletingCategory.id}`, {
      preserveScroll: true,
      onSuccess: closeModal,
    })
  }

  return (
    <ManagementLayout title="Catégories des produits & Services">
      <section className="flex w-full flex-col gap-6">
        <PageHeader
          title="Catégories des produits & Services"
          description="Organisez les différents produits et services proposés par votre imprimerie."
          icon={Tags}
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

        {/* Tableau des catégories */}
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-62.5">Nom de la catégorie</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-30">Statut</TableHead>
                <TableHead className="w-30">Date de création</TableHead>
                <TableHead className="w-30 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <EmptyState
                      icon={Tags}
                      title="Aucune catégorie trouvée"
                      description="Il n'y a aucune catégorie correspondant à votre recherche ou aucun enregistrement n'existe encore."
                      className="border-none shadow-none bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-semibold text-foreground">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-md truncate">
                      {cat.description || (
                        <span className="italic text-muted-foreground/60">Aucune description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cat.isActive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
                        >
                          <CheckCircle2 className="size-3" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-muted bg-muted/50 text-muted-foreground gap-1"
                        >
                          <XCircle className="size-3" />
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    {/* Utilise formatShortDate depuis ~/utils/date au lieu d'une fonction locale */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formatShortDate(cat.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditModal(cat)}
                          title="Modifier"
                        >
                          <Edit2 className="size-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingCategory(cat)}
                          title="Supprimer"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
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

      {/* Dialog de confirmation de suppression */}
      <ConfirmationDialog
        open={Boolean(deletingCategory)}
        title="Supprimer la catégorie"
        description={`Êtes-vous sûr de vouloir supprimer la catégorie "${deletingCategory?.name ?? ''}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
        onCancel={closeModal}
        onConfirm={confirmDelete}
      />
    </ManagementLayout>
  )
}

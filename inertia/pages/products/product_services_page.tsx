import { router } from '@inertiajs/react'
import { Package, Plus, Search, Settings, Wrench } from 'lucide-react'
import { useState } from 'react'
import { ProductCard } from '~/components/products/product_card'
import { ProductServiceModal } from '~/components/products/product_service_modal'
import { Button } from '~/components/ui/button'
import { ConfirmationDialog } from '~/components/ui/confirmation_dialog'
import { EmptyState } from '~/components/common/empty_state'
import { Input } from '~/components/ui/input'
import { PageHeader } from '~/components/common/page_header'
import { StatCard } from '~/components/common/stat_card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ManagementLayout } from '~/layouts/management_layout'
import type { ProductServicesPageProps, ProductServiceItem } from '~/types/product_service_types'

/**
 * Page principale de gestion des Produits et Services.
 * Permet de visualiser, créer, modifier et supprimer des articles (produits physiques et services)
 * organisés par onglets sous forme de cartes d'affichage.
 */
export default function ProductServicesPage({
  products,
  services,
  stats,
  categories,
}: ProductServicesPageProps) {
  // Terme de recherche textuelle pour filtrer dynamiquement les produits/services
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ProductServiceItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [defaultModalType, setDefaultModalType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT')

  /**
   * Filtre la liste transmise selon le mot-clé saisi dans la barre de recherche.
   */
  const filterItems = (list: ProductServiceItem[]) => {
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((i) => i.name.toLowerCase().includes(q))
  }

  const filteredProducts = filterItems(products)
  const filteredServices = filterItems(services)

  // Ouvre la boîte de dialogue en mode création avec un type par défaut ('PRODUCT' ou 'SERVICE').
  const openCreateModal = (type: 'PRODUCT' | 'SERVICE' = 'PRODUCT') => {
    setSelectedItem(null)
    setDefaultModalType(type)
    setIsModalOpen(true)
  }

  // Ouvre la boîte de dialogue en mode modification avec les données de l'article sélectionné.
  const openEditModal = (item: ProductServiceItem) => {
    setSelectedItem(item)
    setDefaultModalType(item.type as 'PRODUCT' | 'SERVICE')
    setIsModalOpen(true)
  }

  //Ouvre la boîte de dialogue de confirmation de suppression pour l'article sélectionné.
  const openDeleteModal = (item: ProductServiceItem) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  // Ferme toutes les boîtes de dialogue et réinitialise l'élément sélectionné.
  const closeModal = () => {
    setIsModalOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedItem(null)
  }

  // Soumet les données du formulaire de création ou d'édition vers le contrôleur backend via Inertia.
  const saveItem = (formData: FormData) => {
    const options = { preserveScroll: true, onSuccess: closeModal }
    const payload = Object.fromEntries(formData)

    if (selectedItem) {
      router.put(`/management/product-services/${selectedItem.id}`, payload, options)
    } else {
      router.post('/management/product-services', payload, options)
    }
  }

  // Effectue la suppression définitive de l'article sélectionné après confirmation.
  const confirmDelete = () => {
    if (!selectedItem) return
    router.delete(`/management/product-services/${selectedItem.id}`, {
      preserveScroll: true,
      onSuccess: closeModal,
    })
  }

  // Configuration des cartes de statistiques dérivées des props
  const statCards = [
    { label: 'Total Articles', value: stats.total },
    {
      label: 'Produits',
      value: stats.productCount,
      className: 'border-blue-200/50 dark:border-blue-950 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Services',
      value: stats.serviceCount,
      className: 'border-violet-200/50 dark:border-violet-950 text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Actifs',
      value: stats.activeCount,
      className:
        'border-emerald-200/50 dark:border-emerald-950 text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <ManagementLayout title="Produits & Services">
      <section className="flex w-full flex-col gap-6">
        {/* En-tête de la page avec boutons de création rapide */}
        <PageHeader
          title="Produits & Services"
          description="Gérez le catalogue des articles, les services et leurs tarifs proposés par votre imprimerie."
          icon={Settings}
        >
          <Button type="button" onClick={() => openCreateModal()}>
            <Plus className="mr-2 size-4" />
            Nouvel article
          </Button>
        </PageHeader>

        {/* Grille des cartes de statistiques */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} className={s.className} />
          ))}
        </div>

        {/* Barre de recherche globale par nom ou description */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="ps-search"
            placeholder="Rechercher un produit ou service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Système d'onglets séparant les Produits et les Services */}
        <Tabs defaultValue="products">
          <TabsList className="w-full">
            <TabsTrigger
              value="products"
              className="flex-1 gap-2 data-active:bg-primary data-active:text-white"
            >
              <Package className="size-4" />
              Produits ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="flex-1 gap-2 data-active:bg-primary data-active:text-white"
            >
              <Wrench className="size-4" />
              Services ({filteredServices.length})
            </TabsTrigger>
          </TabsList>

          {/* === ONGLET PRODUITS === */}
          <TabsContent value="products">
            {filteredProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucun produit trouvé"
                description="Cliquez sur « Nouveau Produit » pour ajouter un article physique au catalogue."
              />
            ) : (
              <div className="mt-2 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredProducts.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* === ONGLET SERVICES === */}
          <TabsContent value="services">
            {filteredServices.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Aucun service trouvé"
                description="Cliquez sur « Nouveau Service » pour ajouter une prestation au catalogue."
              />
            ) : (
              <div className="mt-2 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredServices.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Boîte de dialogue de Création / Modification */}
      <ProductServiceModal
        key={`${selectedItem?.id ?? 'new'}-${defaultModalType}`}
        title={selectedItem ? "Modifier l'article" : 'Nouvel article'}
        description={
          selectedItem
            ? 'Modifiez les informations et tarifs de cet article.'
            : 'Remplissez les informations ci-dessous pour ajouter un article.'
        }
        open={isModalOpen}
        item={selectedItem}
        submitLabel={selectedItem ? 'Enregistrer' : 'Créer'}
        categories={categories}
        defaultType={defaultModalType}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
        action={saveItem}
      />

      {/* Boîte de dialogue de confirmation de suppression */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        title="Supprimer cet article ?"
        description={`Cette action est irréversible. L'article « ${selectedItem?.name} » sera définitivement supprimé.`}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
        onCancel={closeModal}
        onConfirm={confirmDelete}
      />
    </ManagementLayout>
  )
}

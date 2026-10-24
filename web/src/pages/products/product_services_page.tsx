import { Package, Plus, Settings, Wrench } from 'lucide-react'
import { useState } from 'react'
import { ProductCard } from '~/components/products/product_card'
import { ProductServiceModal } from '~/components/products/product_service_modal'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/common/empty_state'
import { PageHeader } from '~/components/common/page_header'
import { SearchInput } from '~/components/common/search_input'
import { StatCard } from '~/components/common/stat_card'
import { PaginationControls } from '~/components/ui/pagination_controls'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { usePaginated } from '~/hooks/use_paginated'
import { useSearch } from '~/hooks/use_search'
import { ManagementLayout } from '~/layouts/management_layout'
import { useCrud } from '~/hooks/common/useCrud'
import type { ProductCategoryDTO } from '~/types/dto'
import type {
  ProductServiceItem,
  ProductServiceStats,
  ProductServicesPageProps,
} from '~/types/product_service_types'

const PRODUCT_SERVICES_PAGE_SIZE = 20

/**
 * Page principale de gestion des Produits et Services.
 * Permet de visualiser, créer et modifier des articles (produits physiques et services)
 * organisés par onglets sous forme de cartes d'affichage.
 */
const EMPTY_ITEMS: ProductServiceItem[] = []
const EMPTY_CATEGORIES: ProductCategoryDTO[] = []
const EMPTY_STATS = { total: 0, productCount: 0, serviceCount: 0 } as ProductServiceStats

export default function ProductServicesPage() {
  const { useGetWithParams, useCreate, usePatch } = useCrud<ProductServicesPageProps>({
    endpoint: '/product-services',
    // La liste des services vendables de la vente a sa propre clé : elle est rechargée aussi
    invalidateQueries: ['/product-services'],
  })
  const { data } = useGetWithParams()
  const products = data?.products ?? EMPTY_ITEMS
  const services = data?.services ?? EMPTY_ITEMS
  const stats = data?.stats ?? EMPTY_STATS
  const categories = data?.categories ?? EMPTY_CATEGORIES
  const saveItemMutation = useCreate<Record<string, unknown>>()
  const updateItemMutation = usePatch<Record<string, unknown>>()
  // Terme de recherche textuelle pour filtrer dynamiquement les produits/services
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ProductServiceItem | null>(null)
  const [defaultModalType, setDefaultModalType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT')
  // Onglet affiché : il décide du type de l'article créé par le bouton de l'en-tête
  const [activeTab, setActiveTab] = useState('products')
  const isServicesTab = activeTab === 'services'
  const { filteredItems: filteredProducts } = useSearch({
    items: products,
    fields: ['name'],
    search,
    onSearchChange: setSearch,
  })
  const { filteredItems: filteredServices } = useSearch({
    items: services,
    fields: ['name'],
    search,
    onSearchChange: setSearch,
  })
  // Pagination locale appliquée apres la recherche pour limiter chaque onglet a 20 cartes.
  const paginatedProducts = usePaginated({
    initialItems: filteredProducts,
    pageSize: PRODUCT_SERVICES_PAGE_SIZE,
  })
  const paginatedServices = usePaginated({
    initialItems: filteredServices,
    pageSize: PRODUCT_SERVICES_PAGE_SIZE,
  })

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

  // Ferme toutes les boîtes de dialogue et réinitialise l'élément sélectionné.
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  // Soumet les données du formulaire de création ou d'édition vers le contrôleur backend via l'API.
  const saveItem = (formData: FormData) => {
    const options = { onSuccess: closeModal }
    const payload: Record<string, FormDataEntryValue | null> = Object.fromEntries(formData)

    // Les Select sans valeur renvoient une chaine vide; le backend attend null pour les champs optionnels.
    payload.categoryId = payload.categoryId || null
    payload.baseUnit = payload.baseUnit || null
    payload.packagingUnit = payload.packagingUnit || null
    payload.packagingCapacity = payload.packagingCapacity || null

    if (selectedItem) {
      updateItemMutation.mutate({ id: selectedItem.id, data: payload }, options)
    } else {
      saveItemMutation.mutate(payload, options)
    }
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
          accentClassName={MODULE_HEADER_ACCENTS.management}
        >
          <Button
            type="button"
            onClick={() => openCreateModal(isServicesTab ? 'SERVICE' : 'PRODUCT')}
          >
            <Plus className="mr-2 size-4" />
            {isServicesTab ? 'Nouveau service' : 'Nouveau produit'}
          </Button>
        </PageHeader>

        {/* Grille des cartes de statistiques */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} className={s.className} />
          ))}
        </div>

        {/* Barre de recherche globale par nom ou description */}
        <SearchInput
          id="ps-search"
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un produit ou service..."
          className="max-w-sm"
          inputClassName="h-8"
        />

        {/* Système d'onglets séparant les Produits et les Services */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
          <TabsList className="w-full">
            <TabsTrigger value="products" className="flex-1 gap-2">
              <Package className="size-4" />
              Produits ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="flex-1 gap-2">
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
              <>
                {paginatedProducts.totalLoadedPages > 1 && (
                  <PaginationControls
                    currentPage={paginatedProducts.currentPage}
                    totalPages={paginatedProducts.totalLoadedPages}
                    onPageChange={paginatedProducts.goToPage}
                  />
                )}

                <div className="mt-2 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedProducts.visibleItems.map((item) => (
                    <ProductCard key={item.id} item={item} onEdit={openEditModal} />
                  ))}
                </div>
              </>
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
              <>
                {paginatedServices.totalLoadedPages > 1 && (
                  <PaginationControls
                    currentPage={paginatedServices.currentPage}
                    totalPages={paginatedServices.totalLoadedPages}
                    onPageChange={paginatedServices.goToPage}
                  />
                )}

                <div className="mt-2 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedServices.visibleItems.map((item) => (
                    <ProductCard key={item.id} item={item} onEdit={openEditModal} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Boîte de dialogue de Création / Modification */}
      <ProductServiceModal
        key={`${selectedItem?.id ?? 'new'}-${defaultModalType}`}
        title={
          selectedItem
            ? "Modifier l'article"
            : defaultModalType === 'SERVICE'
              ? 'Nouveau service'
              : 'Nouveau produit'
        }
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
    </ManagementLayout>
  )
}

import type {
  JournalisationModule,
  JournalisationModuleFilter,
  JournalisationSelectOption,
} from '~/types/journalisation_types'

// Libelles lisibles des modules enregistres dans le journal.
export const JOURNALISATION_MODULE_LABELS: Record<JournalisationModule, string> = {
  AUTHENTIFICATION: 'Authentification',
  USERS: 'Employés',
  EXCHANGE_RATES: 'Taux de change',
  PRODUCT_CATEGORIES: 'Catégories produits',
  PRODUCT_SERVICES: 'Produits et services',
  INVENTORY: 'Stock',
  CUSTOMERS: 'Clients',
  SALES: 'Ventes',
}

// Options disponibles dans le filtre module.
export const JOURNALISATION_MODULE_OPTIONS: Array<
  JournalisationSelectOption<JournalisationModuleFilter>
> = [
  { value: 'ALL', label: 'Tous les modules' },
  { value: 'AUTHENTIFICATION', label: 'Authentification' },
  { value: 'USERS', label: 'Employés' },
  { value: 'EXCHANGE_RATES', label: 'Taux de change' },
  { value: 'PRODUCT_CATEGORIES', label: 'Catégories produits' },
  { value: 'PRODUCT_SERVICES', label: 'Produits et services' },
  { value: 'INVENTORY', label: 'Stock' },
  { value: 'CUSTOMERS', label: 'Clients' },
  { value: 'SALES', label: 'Ventes' },
]

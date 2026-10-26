// Modules connus côté backend pour le journal des actions.
export type JournalisationModule =
  | 'AUTHENTIFICATION'
  | 'USERS'
  | 'EXCHANGE_RATES'
  | 'PRODUCT_CATEGORIES'
  | 'PRODUCT_SERVICES'
  | 'INVENTORY'
  | 'CUSTOMERS'
  | 'SALES'

// Valeur utilisée uniquement par le filtre frontend pour afficher tous les modules.
export type JournalisationModuleFilter = JournalisationModule | 'ALL'

// Utilisateur lié à une entrée de journalisation.
type JournalisationUser = {
  fullName: string | null
}

// Ligne sérialisée affichée dans la page journalisation.
export type JournalisationListItem = {
  id: string
  module: JournalisationModule
  message: string
  createdAt: string
  user: JournalisationUser | null
}

// Option générique pour le select de filtre module.
export interface JournalisationSelectOption<T extends string> {
  value: T
  label: string
}

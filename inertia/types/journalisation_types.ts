import type { JSONDataTypes } from '@adonisjs/core/types/transformers'

// Modules connus côté backend pour le journal des actions.
export type JournalisationModule = 'AUTHENTIFICATION' | 'USERS'

// Valeur utilisée uniquement par le filtre frontend pour afficher tous les modules.
export type JournalisationModuleFilter = JournalisationModule | 'ALL'

// Utilisateur lié à une entrée de journalisation.
export type JournalisationUser = Record<string, JSONDataTypes> & {
  fullName: string | null
}

// Ligne sérialisée affichée dans la page journalisation.
export type JournalisationListItem = Record<string, JSONDataTypes> & {
  id: string
  module: JournalisationModule
  message: string
  createdAt: string
  user: JournalisationUser | null
}

// Filtres appliqués par le controller Inertia.
export type JournalisationFilters = Record<string, JSONDataTypes> & {
  module: JournalisationModuleFilter
  startDate: string | null
  endDate: string | null
}

// Props envoyées à la page journalisation.
export interface JournalisationsPageProps extends Record<string, JSONDataTypes> {
  journalisations: JournalisationListItem[]
  filters: JournalisationFilters
}

// Option générique pour le select de filtre module.
export interface JournalisationSelectOption<T extends string> {
  value: T
  label: string
}

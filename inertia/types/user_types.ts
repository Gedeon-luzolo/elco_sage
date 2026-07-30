import type { JSONDataTypes } from '@adonisjs/core/types/transformers'

// Rôles connus côté backend pour le formulaire utilisateur.
export type UserRole = 'ADMIN' | 'DIRECTOR' | 'CASHIER' | 'OPERATOR'

// Statuts connus côté backend pour le formulaire utilisateur.
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'

// Statistiques globales affichées au-dessus de la liste.
export type UserStats = Record<string, JSONDataTypes> & {
  total: number
  active: number
  inactive: number
  blocked: number
}

// Ligne de distribution utilisée pour les compteurs par statut.
export type UserStatusDistribution = Record<string, JSONDataTypes> & {
  status: UserStatus
  total: number
}

// Forme sérialisée exposée par UserTransformer pour la page.
export type UserListItem = Record<string, JSONDataTypes> & {
  id: string
  fullName: string | null
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string | null
  updatedAt: string | null
  initials: string
}

// Props envoyées par le controller Inertia.
export interface UsersPageProps extends Record<string, JSONDataTypes> {
  users: UserListItem[]
  stats: UserStats
  statusDistribution: UserStatusDistribution[]
}

// État local partagé entre création et modification.
export interface UserFormState {
  fullName: string
  email: string
  role: UserRole
  status: UserStatus
}

// Option générique pour les selects rôle/statut.
export interface UserSelectOption<T extends string> {
  value: T
  label: string
}

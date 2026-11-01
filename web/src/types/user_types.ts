// Rôles connus côté backend pour le formulaire utilisateur.
export type UserRole = 'ADMIN' | 'DIRECTOR' | 'CASHIER' | 'OPERATOR'

// Statuts connus côté backend pour le formulaire utilisateur.
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'

// Statistiques globales affichées au-dessus de la liste.
export type UserStats = {
  total: number
  active: number
  inactive: number
  blocked: number
}

// Ligne de distribution utilisée pour les compteurs par statut.
export type UserStatusDistribution = {
  status: UserStatus
  total: number
}

// Compte tel que renvoyé par l'API (sans mot de passe ni compteur d'échecs).
export type UserListItem = {
  id: string
  fullName: string | null
  email: string
  role: UserRole
  status: UserStatus
  hasSystemAccess: boolean
  createdAt: string | null
  updatedAt: string | null
}

// Réponse de la liste des comptes.
export interface UsersPageProps {
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
  hasSystemAccess: boolean
}

// Réponse d'une création ou d'une modification : un mot de passe seulement si l'accès vient d'être ouvert.
export interface UserPasswordResult {
  temporaryPassword: string | null
}

// Option générique pour les selects rôle/statut.
export interface UserSelectOption<T extends string> {
  value: T
  label: string
}

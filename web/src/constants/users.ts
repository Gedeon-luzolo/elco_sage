import type { UserFormState, UserRole, UserSelectOption, UserStatus } from '~/types/user_types'

// Options disponibles pour le champ role utilisateur.
export const USER_ROLE_OPTIONS: Array<UserSelectOption<UserRole>> = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DIRECTOR', label: 'Directeur' },
  { value: 'CASHIER', label: 'Caissier' },
  { value: 'OPERATOR', label: 'Operateur' },
]

// Options disponibles pour le champ statut utilisateur.
export const USER_STATUS_OPTIONS: Array<UserSelectOption<UserStatus>> = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'BLOCKED', label: 'Bloque' },
]

// Etat initial du formulaire utilisateur.
export const EMPTY_USER_FORM: UserFormState = {
  fullName: '',
  email: '',
  role: 'OPERATOR',
  status: 'ACTIVE',
}

// Libelles courts des roles dans les cards.
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  DIRECTOR: 'Directeur',
  CASHIER: 'Caissier',
  OPERATOR: 'Operateur',
}

// Libelles des statuts utilisateur.
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Actifs',
  INACTIVE: 'Inactifs',
  BLOCKED: 'Bloques',
}

import type { UserRole } from '~/types/user_types'

export const MANAGEMENT_ROLES: UserRole[] = ['ADMIN', 'DIRECTOR']

// Renvoie true si le role est un role de gestion (admin ou directeur).
export function isManagementRole(role?: UserRole | null) {
  return Boolean(role && MANAGEMENT_ROLES.includes(role))
}

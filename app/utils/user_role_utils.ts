import { UserRole } from '#models/user'

export const MANAGEMENT_ROLES = [UserRole.ADMIN, UserRole.DIRECTOR]

// Renvoie true si le role est un role de gestion (admin ou directeur).
export function isManagementRole(role: UserRole) {
  return MANAGEMENT_ROLES.includes(role)
}

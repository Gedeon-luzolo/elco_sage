import type { User } from '../entities/user.entity.js';
import { UserRole } from '../enums/user.enums.js';

// La direction gère ; la caisse vend.
export const MANAGEMENT_ROLES = [UserRole.ADMIN, UserRole.DIRECTOR];

// Renvoie true si le rôle est un rôle de gestion (admin ou directeur).
export function isManagementRole(role: UserRole) {
  return MANAGEMENT_ROLES.includes(role);
}

/**
 * Nom affiché d'un utilisateur : son nom complet, sinon son email (null si absent).
 */
export function getUserDisplayName(
  user: Pick<User, 'fullName' | 'email'> | null | undefined,
) {
  return user ? (user.fullName ?? user.email) : null;
}

/**
 * Colonnes d'un utilisateur joint à une autre ligne (vendeur, opérateur…) : de quoi l'afficher, rien de plus.
 */
export function userSummaryFields(alias: string) {
  return [`${alias}.id`, `${alias}.fullName`, `${alias}.email`];
}

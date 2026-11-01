import bcrypt from 'bcryptjs';
import type { User } from '../entities/user.entity.js';
import { UserRole } from '../enums/user.enums.js';

// Mot de passe initial à communiquer au nouvel utilisateur.
export const DEFAULT_USER_PASSWORD = '12345678';

// Hash du mot de passe initial, posé à la création ou à l'ouverture de l'accès.
export function hashDefaultPassword() {
  return bcrypt.hash(DEFAULT_USER_PASSWORD, 10);
}

// La direction gère ; la caisse vend.
export const MANAGEMENT_ROLES = [UserRole.ADMIN, UserRole.DIRECTOR];

// Renvoie true si le rôle est un rôle de gestion (admin ou directeur).
export function isManagementRole(role: UserRole) {
  return MANAGEMENT_ROLES.includes(role);
}

/**
 * Accès au système retenu pour un compte : la direction l'a toujours,
 * les autres rôles ont celui demandé, ou à défaut tous sauf l'opérateur.
 */
export function resolveSystemAccess(role: UserRole, requested?: boolean) {
  // Sans accès, la direction ne pourrait plus gérer les comptes.
  if (isManagementRole(role)) return true;

  return requested ?? role !== UserRole.OPERATOR;
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

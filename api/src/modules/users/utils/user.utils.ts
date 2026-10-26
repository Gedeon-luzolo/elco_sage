import type { User } from '../entities/user.entity.js';
import { UserRole } from '../enums/user.enums.js';

// La direction gère ; la caisse vend.
export const MANAGEMENT_ROLES = [UserRole.ADMIN, UserRole.DIRECTOR];

// Renvoie true si le rôle est un rôle de gestion (admin ou directeur).
export function isManagementRole(role: UserRole) {
  return MANAGEMENT_ROLES.includes(role);
}

/**
 * Initiales lisibles pour l'avatar : celles du nom complet, sinon celles de l'email.
 */
export function getUserInitials(user: Pick<User, 'fullName' | 'email'>) {
  // Le nom complet en priorité ; à défaut, la partie avant et après le @ de l'email.
  const [first, last] = user.fullName
    ? user.fullName.split(' ')
    : user.email.split('@');

  // Deux segments donnent de meilleures initiales.
  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }

  // Un seul mot : ses deux premières lettres.
  return first.slice(0, 2).toUpperCase();
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
 * Ce que l'API expose d'un utilisateur : jamais le mot de passe ni le compteur d'échecs.
 */
export function toUserResponse(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    initials: getUserInitials(user),
  };
}

/**
 * Enum pour les filtres de statut dans les pages d'administration.
 */
export enum StatusFilter {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * Options pre-formatees pour les selects qui soumettent un statut booleen.
 */
export const ACTIVE_STATUS_OPTIONS = [
  { label: 'Actif', value: 'true' },
  { label: 'Inactif', value: 'false' },
] as const

/**
 * Vérifie si un statut booléen correspond à un filtre de statut donné.
 *
 * @param isActive Statut booléen de l'entité (true/false)
 * @param filter Filtre actif ('all' | 'active' | 'inactive')
 */
export function matchesStatusFilter(isActive: boolean, filter: StatusFilter | string): boolean {
  if (filter === StatusFilter.ALL || filter === 'all') {
    return true
  }

  if (filter === StatusFilter.ACTIVE || filter === 'active') {
    return isActive
  }

  if (filter === StatusFilter.INACTIVE || filter === 'inactive') {
    return !isActive
  }

  return true
}

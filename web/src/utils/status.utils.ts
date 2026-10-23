/**
 * Enum pour les filtres de statut dans les pages d'administration.
 */
export enum StatusFilter {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * Enum représentant le statut d'activation d'une entité.
 */
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * Libellés conviviaux en français pour chaque statut.
 */
export const STATUS_LABELS: Record<EntityStatus, string> = {
  [EntityStatus.ACTIVE]: 'Actif',
  [EntityStatus.INACTIVE]: 'Inactif',
}

/**
 * Options pré-formatées pour les sélecteurs de filtres par statut.
 */
export const STATUS_FILTER_OPTIONS = [
  { value: StatusFilter.ALL, label: 'Toutes' },
  { value: StatusFilter.ACTIVE, label: 'Actives' },
  { value: StatusFilter.INACTIVE, label: 'Inactives' },
] as const

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

/**
 * Convertit un statut booléen en enum EntityStatus.
 */
export function toEntityStatus(isActive: boolean): EntityStatus {
  return isActive ? EntityStatus.ACTIVE : EntityStatus.INACTIVE
}

/**
 * Convertit une valeur de Select ('true'/'false') en booléen.
 */
export function parseStatusBoolean(value: string | boolean): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  return value === 'true'
}

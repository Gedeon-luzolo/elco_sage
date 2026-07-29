import type User from '#models/user'
import type { UserStatus } from '#models/user'
import type { JSONDataTypes } from '@adonisjs/core/types/transformers'

// Resultat renvoye apres creation d'un utilisateur.
export interface CreatedUserResult {
  user: User
  temporaryPassword: string
}

// Compteurs globaux de la table users.
export interface UserStats extends Record<string, JSONDataTypes> {
  total: number
  active: number
  inactive: number
  blocked: number
}

// Ligne de distribution par statut.
export interface UserStatusDistribution extends Record<string, JSONDataTypes> {
  status: UserStatus
  total: number
}

// Donnees groupees pour la page gestion utilisateurs.
export interface UserOverview {
  users: User[]
  stats: UserStats
  statusDistribution: UserStatusDistribution[]
}

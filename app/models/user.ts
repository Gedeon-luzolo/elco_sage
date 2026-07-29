import { UserSchema } from '#database/schema'
import { randomUUID } from 'node:crypto'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { beforeCreate, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

export enum UserRole {
  ADMIN = 'ADMIN',
  DIRECTOR = 'DIRECTOR',
  CASHIER = 'CASHIER',
  OPERATOR = 'OPERATOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @column()
  declare role: UserRole

  @column()
  declare status: UserStatus

  /**
   * Genere la cle primaire avant l'insertion en base.
   * On garde des UUID comme dans l'ancien backend Nest.
   * La migration definit la colonne, ce hook definit la valeur.
   */
  @beforeCreate()
  static assignUuid(user: User) {
    // Lucid appelle ce hook uniquement pour les nouvelles lignes.
    user.id = randomUUID()
  }

  /**
   * Calcule des initiales lisibles pour l'interface.
   * Utilise le nom complet quand il existe, sinon l'email.
   * Ne stocke rien en base, c'est une valeur derivee.
   */
  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')

    // Deux segments donnent de meilleures initiales pour l'avatar utilisateur.
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }

    return `${first.slice(0, 2)}`.toUpperCase()
  }
}

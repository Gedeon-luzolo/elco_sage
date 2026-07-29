import User, { UserRole, UserStatus } from '#models/user'
import type {
  CreatedUserResult,
  UserOverview,
  UserStats,
  UserStatusDistribution,
} from '#types/users'
import type { CreateUserInput, UpdateUserInput } from '#validators/user'
import db from '@adonisjs/lucid/services/db'

const DEFAULT_USER_PASSWORD = '12345678'
const USER_CREATION_ROLES = [UserRole.ADMIN, UserRole.DIRECTOR]

export default class UserService {
  /**
   * Recupere les donnees principales de la page utilisateurs en une seule requete.
   * La liste reste limitee aux comptes recents, mais les compteurs couvrent toute la table.
   * Les compteurs SQL evitent de charger tous les utilisateurs en memoire.
   */
  async getUsersOverview(limit = 30): Promise<UserOverview> {
    const users = await User.query()
      .select('users.*')
      .select(
        db.raw(
          `
          count(*) over () as stats_total,
          count(*) filter (where status = ?) over () as stats_active,
          count(*) filter (where status = ?) over () as stats_inactive,
          count(*) filter (where status = ?) over () as stats_blocked
        `,
          [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED]
        )
      )
      .orderBy('createdAt', 'desc')
      .limit(limit)

    // On extrait les compteurs globaux de la premiere ligne de resultat.
    const stats = this.extractStats(users)

    return {
      users,
      stats,
      statusDistribution: this.buildStatusDistribution(stats),
    }
  }

  /**
   * Cree un utilisateur depuis un compte autorise.
   * Seuls l'admin et le directeur peuvent ouvrir de nouveaux comptes.
   * Le mot de passe initial est fixe pour forcer un changement apres connexion.
   */
  async create(actor: User, payload: CreateUserInput): Promise<CreatedUserResult> {
    // La regle d'autorisation reste proche de la logique metier de creation utilisateur.
    this.ensureCanCreateUser(actor)

    const user = await User.create({
      fullName: payload.fullName,
      email: payload.email,
      password: DEFAULT_USER_PASSWORD,
      role: payload.role,
      status: payload.status ?? UserStatus.ACTIVE,
      failedLoginAttempts: 0,
    })

    return {
      user,
      temporaryPassword: DEFAULT_USER_PASSWORD,
    }
  }

  /**
   * Met a jour un compte utilisateur existant depuis le back-office.
   * L'autorisation reste identique a la creation pour garder une regle simple.
   * Le mot de passe n'est pas change par cette action.
   */
  async update(actor: User, userId: string, payload: UpdateUserInput): Promise<User> {
    this.ensureCanCreateUser(actor)

    const user = await User.findOrFail(userId)

    // Si l'email change, on verifie qu'il n'est pas deja utilise par un autre compte.
    if (user.email !== payload.email) {
      await this.ensureEmailAvailable(payload.email, user.id)
    }

    // On applique les changements sur le modele et on sauvegarde.
    user.merge({
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
      status: payload.status,
    })

    await user.save()
    return user
  }

  /**
   * Supprime un compte depuis la page gestion utilisateurs.
   * Un utilisateur ne peut pas supprimer son propre compte connecte.
   * La suppression reste physique car aucune colonne deleted_at n'existe encore.
   */
  async delete(actor: User, userId: string): Promise<void> {
    this.ensureCanCreateUser(actor)

    if (actor.id === userId) {
      throw new Error('Vous ne pouvez pas supprimer votre propre compte')
    }

    const user = await User.findOrFail(userId)
    await user.delete()
  }

  // Verifie que l'acteur peut creer des utilisateurs.
  private ensureCanCreateUser(actor: User) {
    // Le role vient de la session authentifiee, pas du payload envoye par le client.
    if (USER_CREATION_ROLES.includes(actor.role)) {
      return
    }

    throw new Error("Vous n'avez pas le droit de creer des utilisateurs")
  }

  // Verifie que l'email n'est pas deja porte par un autre compte.
  private async ensureEmailAvailable(email: string, ignoredUserId: string) {
    const existingUser = await User.query()
      .where('email', email)
      .whereNot('id', ignoredUserId)
      .first()

    if (existingUser) {
      throw new Error('Cet email est deja utilise par un autre utilisateur')
    }
  }

  // Extrait les compteurs globaux renvoyes par la requete de listing.
  private extractStats(users: User[]): UserStats {
    const extras = users[0]?.$extras

    return {
      total: Number(extras?.stats_total ?? 0),
      active: Number(extras?.stats_active ?? 0),
      inactive: Number(extras?.stats_inactive ?? 0),
      blocked: Number(extras?.stats_blocked ?? 0),
    }
  }

  // Prepare la distribution par statut pour le frontend.
  private buildStatusDistribution(stats: UserStats): UserStatusDistribution[] {
    return [
      {
        status: UserStatus.ACTIVE,
        total: stats.active,
      },
      {
        status: UserStatus.INACTIVE,
        total: stats.inactive,
      },
      {
        status: UserStatus.BLOCKED,
        total: stats.blocked,
      },
    ]
  }
}

import User, { UserRole, UserStatus } from '#models/user'
import type { CreateUserInput } from '#validators/user'

export interface CreatedUserResult {
  user: User
  temporaryPassword: string
}

const DEFAULT_USER_PASSWORD = '12345678'
const USER_CREATION_ROLES = [UserRole.ADMIN, UserRole.DIRECTOR]

export default class UserService {
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
   * Verifie que l'acteur peut creer des utilisateurs.
   * Centralise la regle ADMIN/DIRECTOR pour eviter de la dupliquer.
   * Lance une erreur metier courte exploitable par le controleur.
   */
  private ensureCanCreateUser(actor: User) {
    // Le role vient de la session authentifiee, pas du payload envoye par le client.
    if (USER_CREATION_ROLES.includes(actor.role)) {
      return
    }

    throw new Error('Vous n\'avez pas le droit de creer des utilisateurs')
  }
}

import User, { UserStatus } from '#models/user'
import hash from '@adonisjs/core/services/hash'

const MAX_FAILED_LOGIN_ATTEMPTS = 3

export type LoginAttemptResult =
  | {
      success: true
      user: User
    }
  | {
      success: false
      message: string
    }

export default class AuthAttemptService {
  /**
   * Verifie une tentative de connexion complete.
   * Retourne un user connectable uniquement si le compte est actif.
   * Centralise aussi le blocage automatique apres mauvais mots de passe.
   */
  async attempt(email: string, password: string): Promise<LoginAttemptResult> {
    // On garde le meme message si l'email n'existe pas pour eviter l'enumeration de comptes.
    const user = await User.findBy('email', email)

    if (!user) {
      return this.failed('Email ou mot de passe incorrect')
    }

    // Un compte inactif ou bloque ne doit jamais passer a la verification du mot de passe.
    if (user.status !== UserStatus.ACTIVE) {
      return this.failed(this.getUnavailableAccountMessage(user.status))
    }

    const isPasswordValid = await hash.verify(user.password, password)

    if (!isPasswordValid) {
      return this.registerFailedAttempt(user)
    }

    // Une connexion reussie remet le compteur a zero pour repartir sur un etat sain.
    await this.resetFailedAttempts(user)

    return {
      success: true,
      user,
    }
  }

  /**
   * Enregistre une mauvaise tentative de connexion.
   * Bloque automatiquement le compte au seuil defini.
   * Renvoie toujours un resultat d'echec exploitable par le controleur.
   */
  private async registerFailedAttempt(user: User): Promise<LoginAttemptResult> {
    // On incremente avant de comparer pour bloquer exactement a la 3e erreur.
    user.failedLoginAttempts += 1

    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.status = UserStatus.BLOCKED
      await user.save()

      return this.failed('Compte bloque apres 3 tentatives de connexion echouees')
    }

    await user.save()
    return this.failed('Email ou mot de passe incorrect')
  }

  /**
   * Nettoie le compteur d'erreurs apres une connexion valide.
   * Evite une ecriture inutile si le compteur est deja a zero.
   * Garde le service responsable de l'etat de securite du compte.
   */
  private async resetFailedAttempts(user: User) {
    if (user.failedLoginAttempts === 0) {
      return
    }

    // Le compteur ne doit pas survivre a une authentification reussie.
    user.failedLoginAttempts = 0
    await user.save()
  }

  /**
   * Produit le message adapte aux comptes non connectables.
   * Distingue le blocage automatique de l'inactivation manuelle.
   * Reste volontairement court pour l'affichage dans le flash message.
   */
  private getUnavailableAccountMessage(status: UserStatus) {
    if (status === UserStatus.BLOCKED) {
      return 'Ce compte est bloque. Contactez un administrateur.'
    }

    return 'Ce compte est inactif. Contactez un administrateur.'
  }

  /**
   * Normalise les echecs du service d'authentification.
   * Evite de lancer des exceptions pour un flux metier attendu.
   * Permet au controleur de rester simple et uniforme.
   */
  private failed(message: string): LoginAttemptResult {
    return {
      success: false,
      message,
    }
  }
}

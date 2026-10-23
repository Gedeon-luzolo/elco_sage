import { JournalisationModule } from '#models/journalisation'
import User from '#models/user'
import AuthAttemptService from '#services/auth/auth_attempt_service'
import JournalisationService from '#services/journalisation/journalisation_service'
import UserTransformer from '#transformers/user_transformer'
import { loginValidator } from '#validators/auth/login'
import { verifyPasswordValidator } from '#validators/auth/password'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiSessionController {
  constructor(
    private authAttemptService: AuthAttemptService,
    private journalisationService: JournalisationService
  ) {}

  /**
   * Échange email et mot de passe contre un token d'accès.
   * Réutilise le service de tentatives : blocage après 3 échecs et messages inchangés.
   */
  async login({ request, response, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    // Le service gère les tentatives, le blocage du compte et les messages d'erreur
    const result = await this.authAttemptService.attempt(email, password)

    // Identifiants refusés : le message du service est renvoyé tel quel
    if (!result.success) {
      return response.unauthorized({ message: result.message })
    }

    // Un nouveau token est émis pour cet appareil
    const token = await User.accessTokens.create(result.user)

    // La connexion est tracée dans le journal
    await this.journalisationService.create({
      module: JournalisationModule.AUTHENTIFICATION,
      message: `${result.user.fullName ?? result.user.email} vient de se connecter au système`,
      user: result.user,
    })

    // Le token n'est visible qu'ici : il ne pourra plus être relu ensuite
    return serialize({
      token: token.value!.release(),
      expiresAt: token.expiresAt,
      user: UserTransformer.transform(result.user),
    })
  }

  /**
   * Renvoie l'utilisateur du token courant (hydratation de la SPA au démarrage).
   */
  async me({ auth, serialize }: HttpContext) {
    return serialize({ user: UserTransformer.transform(auth.getUserOrFail()) })
  }

  /**
   * Vérifie le mot de passe de l'utilisateur connecté (déverrouillage de l'écran d'inactivité).
   */
  async verifyPassword({ request, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(verifyPasswordValidator)

    // La vérification ne compte pas comme une tentative de connexion
    const valid = await this.authAttemptService.verifyCurrentPassword(user, payload.password)

    return serialize({ valid })
  }

  /**
   * Révoque le token courant.
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const token = user.currentAccessToken

    // La déconnexion est tracée dans le journal
    await this.journalisationService.create({
      module: JournalisationModule.AUTHENTIFICATION,
      message: `${user.fullName ?? user.email} vient de se déconnecter du système`,
      user,
    })

    // Le token courant est supprimé : il ne sera plus accepté
    await User.accessTokens.delete(user, token.identifier)

    return response.noContent()
  }
}

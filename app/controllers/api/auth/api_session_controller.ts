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
   * Echange email/mot de passe contre un token d'acces.
   * Reutilise le service de tentatives : blocage apres 3 echecs et messages identiques au web.
   */
  async login({ request, response, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const result = await this.authAttemptService.attempt(email, password)

    if (!result.success) {
      return response.unauthorized({ message: result.message })
    }

    const token = await User.accessTokens.create(result.user)

    await this.journalisationService.create({
      module: JournalisationModule.AUTHENTIFICATION,
      message: `${result.user.fullName ?? result.user.email} vient de se connecter au système`,
      user: result.user,
    })

    return serialize({
      token: token.value!.release(),
      expiresAt: token.expiresAt,
      user: UserTransformer.transform(result.user),
    })
  }

  /**
   * Renvoie l'utilisateur du token courant (hydratation de la SPA au demarrage).
   */
  async me({ auth, serialize }: HttpContext) {
    return serialize({ user: UserTransformer.transform(auth.getUserOrFail()) })
  }

  /**
   * Verifie le mot de passe du user connecte (deverrouillage de l'ecran idle).
   */
  async verifyPassword({ request, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(verifyPasswordValidator)

    const valid = await this.authAttemptService.verifyCurrentPassword(user, payload.password)

    return serialize({ valid })
  }

  /**
   * Revoque le token courant.
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const token = user.currentAccessToken

    await this.journalisationService.create({
      module: JournalisationModule.AUTHENTIFICATION,
      message: `${user.fullName ?? user.email} vient de se déconnecter du système`,
      user,
    })

    await User.accessTokens.delete(user, token.identifier)

    return response.noContent()
  }
}

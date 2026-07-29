import UserService from '#services/users/user_service'
import { createUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

const userService = new UserService()

export default class UsersController {
  /**
   * Cree un utilisateur depuis le back-office.
   * L'autorisation ADMIN/DIRECTOR est appliquee par le service.
   * Retourne aussi le mot de passe temporaire a communiquer au nouvel utilisateur.
   */
  async store({ request, auth, response, session }: HttpContext) {
    const actor = auth.user

    if (!actor) {
      return response.redirect().toRoute('session.create')
    }

    const payload = await request.validateUsing(createUserValidator)

    try {
      // Le service gere la regle de role et l'attribution du mot de passe initial.
      const result = await userService.create(actor, payload)

      return response.created({
        user: result.user.serialize(),
        temporaryPassword: result.temporaryPassword,
      })
    } catch (error) {
      session.flash('error', error instanceof Error ? error.message : 'Creation utilisateur impossible')
      return response.redirect().back()
    }
  }
}

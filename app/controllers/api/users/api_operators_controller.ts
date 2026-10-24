import UserService from '#services/users/user_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiOperatorsController {
  constructor(private userService: UserService) {}

  /**
   * Opérateurs sélectionnables sur une vente.
   */
  async index({ serialize }: HttpContext) {
    // Tous les utilisateurs actifs sauf l'administrateur
    return serialize(await this.userService.getActiveOperatorsForSale())
  }
}

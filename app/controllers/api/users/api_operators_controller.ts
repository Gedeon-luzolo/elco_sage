import UserService from '#services/users/user_service'
import UserTransformer from '#transformers/user_transformer'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiOperatorsController {
  constructor(private userService: UserService) {}

  /**
   * Operateurs selectionnables sur une vente.
   */
  async index({ serialize }: HttpContext) {
    return serialize(UserTransformer.transform(await this.userService.getActiveOperatorsForSale()))
  }
}

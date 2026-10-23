import UserService from '#services/users/user_service'
import UserTransformer from '#transformers/user_transformer'
import { apiAction } from '#utils/api_action'
import { createUserValidator, updateUserValidator } from '#validators/user'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiUsersController {
  constructor(private userService: UserService) {}

  /**
   * Liste des utilisateurs avec statistiques et répartition par statut.
   */
  async index({ serialize }: HttpContext) {
    // Les 30 derniers utilisateurs, avec les statistiques calculées par le service
    const overview = await this.userService.getUsersOverview(30)

    return serialize({
      users: UserTransformer.transform(overview.users),
      stats: overview.stats,
      statusDistribution: overview.statusDistribution,
    })
  }

  /**
   * Crée un utilisateur et renvoie le mot de passe temporaire à communiquer.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createUserValidator)

    return apiAction(ctx, async () => {
      // Le service applique la règle de rôle et attribue le mot de passe initial
      const result = await this.userService.create(actor, payload)

      return ctx.response.created(
        await ctx.serialize({ temporaryPassword: result.temporaryPassword })
      )
    })
  }

  /**
   * Modifie un utilisateur (le validateur reçoit l'id pour l'unicité de l'email).
   */
  async update(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    // L'id de l'URL sert à ignorer l'utilisateur lui-même dans le contrôle d'unicité de l'email
    const payload = await ctx.request.validateUsing(updateUserValidator, {
      meta: { id: ctx.params.id },
    })

    return apiAction(ctx, async () => {
      await this.userService.update(actor, ctx.params.id, payload)

      return ctx.response.noContent()
    })
  }

  /**
   * Supprime un utilisateur (jamais soi-même, règle appliquée par le service).
   */
  async destroy(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    return apiAction(ctx, async () => {
      await this.userService.delete(actor, ctx.params.id)

      return ctx.response.noContent()
    })
  }
}

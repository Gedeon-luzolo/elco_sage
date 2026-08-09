import UserService from '#services/users/user_service'
import UserTransformer from '#transformers/user_transformer'
import { createUserValidator, updateUserValidator } from '#validators/user'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class UsersController {
  constructor(private userService: UserService) {}

  /**
   * Affiche la page de gestion des utilisateurs.
   * Recupere la liste, les stats et la distribution par statut ensemble.
   * Le service garde la responsabilite d'optimiser la requete SQL.
   */
  async getUsers({ inertia }: HttpContext) {
    const overview = await this.userService.getUsersOverview(30)

    return inertia.render('users/users_page', {
      users: UserTransformer.transform(overview.users),
      stats: overview.stats,
      statusDistribution: overview.statusDistribution,
    })
  }

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
      const result = await this.userService.create(actor, payload)

      session.flash(
        'success',
        `Utilisateur cree. Mot de passe temporaire : ${result.temporaryPassword}`
      )
      return response.redirect().toRoute('users.get')
    } catch (error) {
      session.flash(
        'error',
        error instanceof Error ? error.message : 'Creation utilisateur impossible'
      )
      return response.redirect().back()
    }
  }

  /**
   * Modifie les informations principales d'un utilisateur.
   * Le controleur injecte l'id courant au validateur pour l'unicite email.
   * Toute regle metier reste deleguee au service utilisateur.
   */
  async update({ params, request, auth, response, session }: HttpContext) {
    const actor = auth.user

    if (!actor) {
      return response.redirect().toRoute('session.create')
    }

    const payload = await request.validateUsing(updateUserValidator, {
      meta: {
        id: params.id,
      },
    })

    try {
      await this.userService.update(actor, params.id, payload)

      session.flash('success', 'Utilisateur mis a jour')
      return response.redirect().toRoute('users.get')
    } catch (error) {
      session.flash(
        'error',
        error instanceof Error ? error.message : 'Mise a jour utilisateur impossible'
      )
      return response.redirect().back()
    }
  }

  /**
   * Supprime un utilisateur depuis le back-office.
   * La protection contre l'auto-suppression est geree dans le service.
   * Redirige vers la liste pour rafraichir les statistiques.
   */
  async destroy({ params, auth, response, session }: HttpContext) {
    const actor = auth.user

    if (!actor) {
      return response.redirect().toRoute('session.create')
    }

    try {
      await this.userService.delete(actor, params.id)

      session.flash('success', 'Utilisateur supprime')
      return response.redirect().toRoute('users.get')
    } catch (error) {
      session.flash(
        'error',
        error instanceof Error ? error.message : 'Suppression utilisateur impossible'
      )
      return response.redirect().back()
    }
  }
}

import AuthAttemptService from '#services/auth/auth_attempt_service'
import { verifyPasswordValidator } from '#validators/auth/password'
import type { HttpContext } from '@adonisjs/core/http'

const authAttemptService = new AuthAttemptService()

export default class SessionController {
  /**
   * Affiche le formulaire de connexion Inertia.
   * Cette route reste reservee aux visiteurs via le middleware guest.
   * Aucun etat d'authentification n'est modifie ici.
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  /**
   * Traite la soumission du formulaire de login.
   * Delegue les tentatives et le blocage au service dedie.
   * Ouvre la session Adonis uniquement apres validation complete.
   */
  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    // Le service renvoie soit un utilisateur connectable, soit un message metier.
    const result = await authAttemptService.attempt(email, password)

    if (!result.success) {
      session.flash('error', result.message)
      return response.redirect().back()
    }

    // La session Adonis est creee seulement apres les controles de securite.
    await auth.use('web').login(result.user)
    return response.redirect().toRoute('home')
  }

  /**
   * Verifie le mot de passe du user connecte pour l'idle screen.
   * Ne cree pas de session et ne compte pas comme tentative de login.
   * Retourne un booleen simple pour le frontend.
   */
  async verifyPassword({ request, auth, response }: HttpContext) {
    const user = auth.user

    if (!user) {
      return response.unauthorized({ valid: false })
    }

    const payload = await request.validateUsing(verifyPasswordValidator)

    // On verifie le password courant sans toucher au compteur failedLoginAttempts.
    const valid = await authAttemptService.verifyCurrentPassword(user, payload.password)

    return response.ok({ valid })
  }

  /**
   * Ferme la session utilisateur courante.
   * Redirige vers la page de connexion apres le logout.
   * Ne touche pas aux compteurs de tentatives du compte.
   */
  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    response.redirect().toRoute('session.create')
  }
}

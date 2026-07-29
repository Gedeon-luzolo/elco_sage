import router from '@adonisjs/core/services/router'

const SessionController = () => import('#controllers/auth/session_controller')

// Regroupe les routes accessibles à tous
export function registerGuestAuthRoutes() {
  router.on('splash').renderInertia('splash', {}).as('splash')
  router.get('login', [SessionController, 'create'])
  router.post('login', [SessionController, 'store'])
}

// Regroupe les routes d'authentification accessibles apres login.
export function registerAuthenticatedAuthRoutes() {
  router
    .post('auth/verify-password', [SessionController, 'verifyPassword'])
    .as('auth.verify_password')
  router.post('logout', [SessionController, 'destroy'])
}

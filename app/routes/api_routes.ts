import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ApiSessionController = () => import('#controllers/api/auth/api_session_controller')

/**
 * Routes JSON consommees par la SPA (dossier web/).
 * Elles cohabitent avec les routes Inertia le temps de la migration.
 */
export function registerApiRoutes() {
  router
    .group(() => {
      router.post('auth/login', [ApiSessionController, 'login'])

      router
        .group(() => {
          router.get('auth/me', [ApiSessionController, 'me'])
          router.post('auth/verify-password', [ApiSessionController, 'verifyPassword'])
          router.post('auth/logout', [ApiSessionController, 'logout'])
        })
        .use(middleware.apiAuth())
    })
    .prefix('api')
    .as('api')
}

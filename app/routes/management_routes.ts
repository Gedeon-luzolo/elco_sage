import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const JournalisationsController = () =>
  import('#controllers/journalisations/journalisations_controller')

// Regroupe les routes du module management.
export function registerManagementRoutes() {
  router
    .on('management')
    .renderInertia('management', {})
    .as('management')
    .use(middleware.managementAccess())
  router
    .get('journalisations', [JournalisationsController, 'getJournalisations'])
    .as('journalisations.get')
    .use(middleware.managementAccess())
}

import router from '@adonisjs/core/services/router'

const JournalisationsController = () =>
  import('#controllers/journalisations/journalisations_controller')

// Regroupe les routes du module management.
export function registerManagementRoutes() {
  router.on('/').renderInertia('management/management', {}).as('management')
  router
    .get('journalisations', [JournalisationsController, 'getJournalisations'])
}

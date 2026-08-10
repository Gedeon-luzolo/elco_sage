import router from '@adonisjs/core/services/router'

const JournalisationsController = () =>
  import('#controllers/journalisations/journalisations_controller')
const DashboardController = () => import('#controllers/management/dashboard_controller')

// Regroupe les routes du module management.
export function registerManagementRoutes() {
  router.get('/', [DashboardController, 'index']).as('management')
  router.get('journalisations', [JournalisationsController, 'getJournalisations'])
}

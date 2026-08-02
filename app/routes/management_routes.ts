import router from '@adonisjs/core/services/router'

const JournalisationsController = () =>
  import('#controllers/journalisations/journalisations_controller')

// Regroupe les routes du module management.
export function registerManagementRoutes() {
  router.on('/').renderInertia('management', {}).as('management')
  router
    .get('journalisations', [JournalisationsController, 'getJournalisations'])
    .as('journalisations.get')
  router.on('products-and-services').renderInertia('products/products_and_services_page', {}).as('management.products_and_services')
}

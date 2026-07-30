import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

// Regroupe les routes du module management.
export function registerManagementRoutes() {
  router
    .on('management')
    .renderInertia('management', {})
    .as('management')
    .use(middleware.managementAccess())
}

import router from '@adonisjs/core/services/router'

const UsersController = () => import('#controllers/users/users_controller')

// Regroupe les routes de gestion utilisateurs.
export function registerUserRoutes() {
  router.get('users', [UsersController, 'getUsers']).as('users.get')
  router.post('users', [UsersController, 'store']).as('users.store')
  router.put('users/:id', [UsersController, 'update']).as('users.update')
  router.delete('users/:id', [UsersController, 'destroy']).as('users.destroy')
}

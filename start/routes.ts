/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import SessionController from '#controllers/auth/session_controller'
import UsersController from '#controllers/users/users_controller'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .on('/')
  .renderInertia('home', {})
  .as('home')
  .use(middleware.auth())
  .use(middleware.managementAccess())

router
  .group(() => {
    router.get('login', [SessionController, 'create'])
    router.post('login', [SessionController, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [SessionController, 'destroy'])
    router.post('users', [UsersController, 'store']).as('users.store')
  })
  .use(middleware.auth())

/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { registerAuthenticatedAuthRoutes, registerGuestAuthRoutes } from '#routes/auth_routes'
import { registerUserRoutes } from '#routes/user_routes'
import router from '@adonisjs/core/services/router'

router
  .on('/')
  .renderInertia('home', {})
  .as('home')
  .use(middleware.auth({ redirectTo: '/splash' }))
  .use(middleware.managementAccess())

router
  .group(() => {
    registerGuestAuthRoutes()
  })
  .use(middleware.guest())

router
  .group(() => {
    registerAuthenticatedAuthRoutes()
    registerUserRoutes()
  })
  .use(middleware.auth())

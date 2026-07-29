/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import SessionController from '#controllers/auth/session_controller'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router.on('/').renderInertia('home', {}).as('home').use(middleware.auth())

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [SessionController, 'create'])
    router.post('login', [SessionController, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [SessionController, 'destroy'])
  })
  .use(middleware.auth())

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
import { registerCustomerRoutes } from '#routes/customer_routes'
import { registerExchangeRateRoutes } from '#routes/exchange_rate_routes'
import { registerManagementRoutes } from '#routes/management_routes'
import { registerProductCategoryRoutes } from '#routes/product_category_routes'
import { registerProductServiceRoutes } from '#routes/product_service_routes'
import { registerStockMovementRoutes } from '#routes/stock_movement_routes'
import { registerUserRoutes } from '#routes/user_routes'
import router from '@adonisjs/core/services/router'

router
  .on('/')
  .renderInertia('home/home', {})
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
    registerCustomerRoutes()

    // Routes de gestion de stock (accessible à tous les utilisateurs authentifiés)
    registerStockMovementRoutes()

    router
      .group(() => {
        registerManagementRoutes()
        registerUserRoutes()
        registerExchangeRateRoutes()
        registerProductCategoryRoutes()
        registerProductServiceRoutes()
      })
      .prefix('management')
      .use(middleware.managementAccess())
  })
  .use(middleware.auth())

import router from '@adonisjs/core/services/router'

const ProductServicesController = () =>
  import('#controllers/products/product_services_controller')

export function registerProductServiceRoutes() {
  router
    .get('product-services', [ProductServicesController, 'index'])
    .as('product_services.index')
  router
    .get('product-services/active-services-for-sale', [ProductServicesController, 'activeForSale'])
    .as('product_services.active_for_sale')
  router
    .post('product-services', [ProductServicesController, 'store'])
    .as('product_services.store')
  router
    .put('product-services/:id', [ProductServicesController, 'update'])
    .as('product_services.update')
  router
    .delete('product-services/:id', [ProductServicesController, 'destroy'])
    .as('product_services.destroy')
}

import router from '@adonisjs/core/services/router'

const CustomersController = () => import('#controllers/customers/customers_controller')

export function registerCustomerRoutes() {
  router.get('customers', [CustomersController, 'index']).as('customers.index')
  router.post('customers', [CustomersController, 'store']).as('customers.store')
  router.put('customers/:id', [CustomersController, 'update']).as('customers.update')
}

import router from '@adonisjs/core/services/router'

const ProductCategoriesController = () => import('#controllers/categories/product_categories_controller')

export function registerProductCategoryRoutes() {
  router.get('product-categories', [ProductCategoriesController, 'index']).as('product_categories.index')
  router.post('product-categories', [ProductCategoriesController, 'store']).as('product_categories.store')
  router.put('product-categories/:id', [ProductCategoriesController, 'update']).as('product_categories.update')
  router.delete('product-categories/:id', [ProductCategoriesController, 'destroy']).as('product_categories.destroy')
}

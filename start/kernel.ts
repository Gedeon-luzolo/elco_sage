import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

// Convertit les exceptions en réponses HTTP
server.errorHandler(() => import('#exceptions/handler'))

// Middlewares de toutes les requêtes, même sans route correspondante
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
])

// Middlewares des requêtes qui correspondent à une route
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])

// Middlewares nommés, à appliquer explicitement sur les routes ou les groupes de routes
export const middleware = router.named({
  apiAuth: () => import('#middleware/api_auth_middleware'),
  apiManagement: () => import('#middleware/api_management_middleware'),
})

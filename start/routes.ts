import { registerApiRoutes } from '#routes/api_routes'

// L'API JSON vit sous /api ; le front compilé est servi par le middleware spa_static
registerApiRoutes()

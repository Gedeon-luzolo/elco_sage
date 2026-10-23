import { useRoutes } from 'react-router-dom'
import { baseRoutes } from '~/routes/base/base.routes'

// Point d'entree du routage : les modules ajoutent leurs routes dans base.routes.
export function AppRoutes() {
  return useRoutes(baseRoutes)
}

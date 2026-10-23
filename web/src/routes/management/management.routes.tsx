import { Navigate, useRoutes } from 'react-router-dom'
import { useAuth } from '~/hooks/auth/useAuth'
import JournalisationsPage from '~/pages/journalisations/journalisations_page'
import ManagementPage from '~/pages/management/management'
import ProductCategoriesPage from '~/pages/categories/product_categories_page'
import ProductServicesPage from '~/pages/products/product_services_page'
import RatesPage from '~/pages/rates/rates_page'
import UsersPage from '~/pages/users/users_page'
import { isManagementRole } from '~/utils/user_role.utils'

/** Table de routes interne au module Management, telechargee uniquement avec lui. */
const managementRoutes = [
  { index: true, element: <ManagementPage /> },
  { path: 'users', element: <UsersPage /> },
  { path: 'journalisations', element: <JournalisationsPage /> },
  { path: 'product-services', element: <ProductServicesPage /> },
  { path: 'product-categories', element: <ProductCategoriesPage /> },
  { path: 'rates', element: <RatesPage /> },
]

/** Entree du module Management montee depuis /management/*, reservee a la direction. */
export function ManagementRoutesModule() {
  const { user } = useAuth()
  const routes = useRoutes(managementRoutes)

  // L'API refuse deja ces appels (403) ; on evite aussi d'afficher les pages aux autres profils.
  return isManagementRole(user?.role) ? routes : <Navigate to="/sales" replace />
}

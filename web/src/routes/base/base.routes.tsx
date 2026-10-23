import { lazy, Suspense } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '~/components/auth/protected_route'
import { useAuth } from '~/hooks/auth/useAuth'
import { AppLayout } from '~/layouts/app_layout'
import Home from '~/pages/home/home'
import Login from '~/pages/auth/login'
import Splash from '~/pages/splash'
import { isManagementRole } from '~/utils/user_role.utils'

// Modules charges en lazy : le bundle initial reste leger.
const SalesModule = lazy(() =>
  import('~/routes/sales/sales.routes').then((module) => ({ default: module.SalesRoutesModule }))
)

const ManagementModule = lazy(() =>
  import('~/routes/management/management.routes').then((module) => ({
    default: module.ManagementRoutesModule,
  }))
)
const CustomersPage = lazy(() => import('~/pages/customers/customers_page'))
const StockMovementsPage = lazy(() => import('~/pages/stock/stock_movements_page'))

const moduleFallback = <div className="min-h-screen" />

// L'accueil de pilotage est reserve a la direction ; les autres profils entrent par les ventes.
function ManagementHome() {
  const { user } = useAuth()

  return isManagementRole(user?.role) ? <Home /> : <Navigate to="/sales" replace />
}

export const baseRoutes: RouteObject[] = [
  { path: '/splash', element: <Splash /> },
  { path: '/login', element: <Login /> },
  {
    // Toutes les pages qui demandent une session active.
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <ManagementHome /> },
          {
            path: '/sales/*',
            element: (
              <Suspense fallback={moduleFallback}>
                <SalesModule />
              </Suspense>
            ),
          },
          {
            path: '/management/*',
            element: (
              <Suspense fallback={moduleFallback}>
                <ManagementModule />
              </Suspense>
            ),
          },
          {
            path: '/customers',
            element: (
              <Suspense fallback={moduleFallback}>
                <CustomersPage />
              </Suspense>
            ),
          },
          {
            path: '/stock',
            element: (
              <Suspense fallback={moduleFallback}>
                <StockMovementsPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]

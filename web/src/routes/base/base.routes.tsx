import { lazy, Suspense } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '~/components/auth/protected_route'
import { useAuth } from '~/hooks/auth/useAuth'
import { AppLayout } from '~/layouts/app_layout'
import Home from '~/pages/home/home'
import Login from '~/pages/auth/login'
import Splash from '~/pages/splash'
import { isManagementRole } from '~/utils/user_role.utils'

// Modules chargés en lazy : le bundle initial reste léger.
const SalesModule = lazy(() =>
  import('~/routes/sales/sales.routes').then((module) => ({ default: module.SalesRoutesModule }))
)

const ManagementModule = lazy(() =>
  import('~/routes/management/management.routes').then((module) => ({
    default: module.ManagementRoutesModule,
  }))
)
const CustomersPage = lazy(() => import('~/pages/customers/customers_page'))

// Écran affiché le temps de charger un module
const moduleFallback = <div className="min-h-screen" />

// L'accueil de pilotage est réservé à la direction ; les autres profils entrent par les ventes.
function ManagementHome() {
  const { user } = useAuth()

  return isManagementRole(user?.role) ? <Home /> : <Navigate to="/sales" replace />
}

// Routes de base : connexion publique, puis tout le reste derrière une session active.
export const baseRoutes: RouteObject[] = [
  { path: '/splash', element: <Splash /> },
  { path: '/login', element: <Login /> },
  {
    // Toutes les pages qui demandent une session active
    element: <ProtectedRoute />,
    children: [
      {
        // Barre d'application, envoi de la file d'attente et écran de verrouillage
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
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]

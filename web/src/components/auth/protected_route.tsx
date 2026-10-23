import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '~/hooks/auth/useAuth'

// Laisse passer uniquement les utilisateurs connectés.
export function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  // Pendant la vérification de la session, un indicateur évite un flash de la page de connexion
  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Sans session, retour à l'écran de connexion
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

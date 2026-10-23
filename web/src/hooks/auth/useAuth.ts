import { useContext } from 'react'
import { AuthContext } from '~/context/auth_context'

// Accès à la session courante ; doit être utilisé sous <AuthProvider>.
export function useAuth() {
  const context = useContext(AuthContext)

  // Utilisation hors du fournisseur : erreur de programmation à signaler tout de suite
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider.')
  }

  return context
}

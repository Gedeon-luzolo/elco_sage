import { useContext } from 'react'
import { AuthContext } from '~/context/auth_context'

// Acces a la session courante ; doit etre utilise sous <AuthProvider>.
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth doit etre utilise dans un AuthProvider.')
  }

  return context
}

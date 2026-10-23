import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, api } from '~/lib/api/fetch'
import { getErrorMessage } from '~/lib/error/get_error_message'
import { clearToken, getToken, setToken, UNAUTHORIZED_EVENT } from '~/lib/api/token'
import {
  ME_KEY,
  type AuthContextType,
  type LoginCredentials,
  type LoginResponse,
} from '~/types/auth_types'
import type { UserDTO } from '~/types/dto'

// Partage l'etat de session et les actions d'authentification dans l'application.
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Sans token il n'y a pas de session : inutile d'interroger le serveur.
  const { data: user, isPending } = useQuery({
    queryKey: ME_KEY,
    enabled: Boolean(getToken()),
    queryFn: async () => {
      try {
        return await api.get<{ user: UserDTO }>('auth/me').then((data) => data.user)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
  })

  // Vide le cache : les donnees appartiennent a la session sortante.
  const endSession = useCallback(() => {
    clearToken()
    queryClient.clear()
    queryClient.setQueryData(ME_KEY, null)
    navigate('/login', { replace: true })
  }, [navigate, queryClient])

  // Un 401 sur n'importe quelle requete (token expire ou revoque) ferme la session locale.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, endSession)

    return () => window.removeEventListener(UNAUTHORIZED_EVENT, endSession)
  }, [endSession])

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      api.post<LoginResponse>('auth/login', credentials),
    onSuccess: (response) => {
      setToken(response.token)
      queryClient.setQueryData(ME_KEY, response.user)
    },
  })

  const login = async (credentials: LoginCredentials) => {
    const response = await loginMutation.mutateAsync(credentials)

    return response.user
  }

  const logout = async () => {
    // Meme si le serveur est injoignable, la session locale doit pouvoir se fermer.
    await api.post('auth/logout').catch(() => undefined)
    endSession()
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: Boolean(getToken()) && isPending,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error ? getErrorMessage(loginMutation.error) : null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

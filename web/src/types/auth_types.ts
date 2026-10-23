import type { UserDTO } from '~/types/dto'

export const ME_KEY = ['/auth/me']

export type LoginCredentials = { email: string; password: string }

export type LoginResponse = { token: string; expiresAt: string | null; user: UserDTO }

export type AuthContextType = {
  user: UserDTO | null
  isLoading: boolean
  isLoggingIn: boolean
  loginError: string | null
  login: (credentials: LoginCredentials) => Promise<UserDTO>
  logout: () => Promise<void>
}

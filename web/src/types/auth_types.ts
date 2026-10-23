import type { UserDTO } from '~/types/dto'

// Clé de la requête qui porte l'utilisateur connecté.
export const ME_KEY = ['/auth/me']

// Identifiants envoyés à la connexion.
export type LoginCredentials = { email: string; password: string }

// Réponse de la connexion : le token d'accès et le profil de l'utilisateur.
export type LoginResponse = { token: string; expiresAt: string | null; user: UserDTO }

// Ce que le contexte d'authentification partage dans l'application.
export type AuthContextType = {
  user: UserDTO | null
  isLoading: boolean
  isLoggingIn: boolean
  loginError: string | null
  login: (credentials: LoginCredentials) => Promise<UserDTO>
  logout: () => Promise<void>
}

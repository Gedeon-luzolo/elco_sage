import type { UserSummaryDTO } from '~/types/dto'

// Nom affiché d'un utilisateur : son nom complet, sinon son email.
export function getUserDisplayName(
  user: Pick<UserSummaryDTO, 'fullName' | 'email'> | null | undefined
) {
  return user ? (user.fullName ?? user.email) : null
}

// Initiales de l'avatar : celles du nom complet, sinon celles de l'email.
export function getUserInitials(user: Pick<UserSummaryDTO, 'fullName' | 'email'>) {
  // Le nom complet en priorité ; à défaut, les parties avant et après le @ de l'email.
  const [first, last] = user.fullName ? user.fullName.split(' ') : user.email.split('@')

  // Deux segments donnent de meilleures initiales.
  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
  }

  // Un seul mot : ses deux premières lettres.
  return (first ?? '').slice(0, 2).toUpperCase()
}

// Options de détection d'un rejeu : l'id du client, la recherche de l'enregistrement,
// le test d'appartenance à l'appelant et le message en cas de conflit.
interface ReplayOptions<T> {
  id: string | undefined
  find: (id: string) => Promise<T | null>
  belongsToCaller: (record: T) => boolean
  conflictMessage: string
}

/**
 * Détecte le rejeu d'une création faite hors ligne.
 *
 * Le client génère l'id de l'enregistrement ; si la requête est renvoyée après une coupure,
 * l'enregistrement existe déjà et doit être renvoyé tel quel au lieu d'être recréé.
 * Si l'id existe mais appartient à un autre appelant ou à une autre ressource, c'est un conflit.
 *
 * @returns l'enregistrement déjà créé, ou null si la création doit se poursuivre.
 */
export async function findReplayedRecord<T>(options: ReplayOptions<T>): Promise<T | null> {
  // Sans id fourni par le client, il ne peut pas y avoir de rejeu
  if (!options.id) {
    return null
  }

  const existing = await options.find(options.id)

  // Id inconnu : c'est une vraie création
  if (!existing) {
    return null
  }

  // Id déjà pris par quelqu'un d'autre : on refuse plutôt que d'exposer son enregistrement
  if (!options.belongsToCaller(existing)) {
    throw new Error(options.conflictMessage)
  }

  return existing
}

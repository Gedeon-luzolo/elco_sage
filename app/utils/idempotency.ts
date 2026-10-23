/**
 * Detecte le rejeu d'une creation faite hors ligne.
 *
 * Le client genere l'id de l'enregistrement ; si la requete est renvoyee apres une coupure,
 * l'enregistrement existe deja et doit etre renvoye tel quel au lieu d'etre recree.
 * Si l'id existe mais appartient a un autre appelant ou a une autre ressource, c'est un conflit.
 *
 * @returns l'enregistrement deja cree, ou null si la creation doit se poursuivre.
 */
export async function findReplayedRecord<T>(options: {
  id: string | undefined
  find: (id: string) => Promise<T | null>
  belongsToCaller: (record: T) => boolean
  conflictMessage: string
}): Promise<T | null> {
  if (!options.id) {
    return null
  }

  const existing = await options.find(options.id)

  if (!existing) {
    return null
  }

  if (!options.belongsToCaller(existing)) {
    throw new Error(options.conflictMessage)
  }

  return existing
}

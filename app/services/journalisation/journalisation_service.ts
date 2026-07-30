import Journalisation from '#models/journalisation'
import type { CreateJournalisationParams, FindJournalisationsParams } from '#types/journalisation'
import { normalizeDateRange } from '#utils/date'

export default class JournalisationService {
  /**
   * Cree une entree de journalisation.
   * Le module est obligatoire pour garder une lecture claire des evenements.
   * L'utilisateur reste optionnel pour journaliser aussi les actions systeme.
   */
  async create({ module, message, user }: CreateJournalisationParams) {
    return Journalisation.create({
      module,
      message,
      userId: user?.id ?? null,
    })
  }

  /**
   * Recupere les entrees de journalisation par batch.
   * Les filtres restent optionnels pour permettre un premier ecran simple.
   * Les bornes de date couvrent toujours la journee complete.
   */
  async findAllBatch({
    offset = 0,
    limit = 50,
    module,
    startDate,
    endDate,
  }: FindJournalisationsParams = {}) {
    const query = Journalisation.query().preload('user').orderBy('createdAt', 'desc').offset(offset)

    if (module) {
      query.where('module', module)
    }

    if (startDate && endDate) {
      const dateRange = normalizeDateRange(startDate, endDate)

      query.whereBetween('createdAt', [dateRange.startDate, dateRange.endDate])
    }

    return query.limit(limit)
  }

  // Supprime toutes les entrees de journalisation.
  async deleteAll() {
    return Journalisation.query().delete()
  }

  // Supprime une entree de journalisation par son id.
  async delete(id: string) {
    return Journalisation.query().where('id', id).delete()
  }
}

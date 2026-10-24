import Journalisation from '#models/journalisation'
import type { CreateJournalisationParams, FindJournalisationsParams } from '#types/journalisation'
import { normalizeDateRange } from '#utils/date_utils'
import { paginateBatch } from '#utils/paginated_batch'

// Nombre maximum d'entrées renvoyées par lot pour le journal.
const JOURNALISATIONS_MAX_BATCH = 50

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
    offset,
    limit,
    module,
    startDate,
    endDate,
  }: FindJournalisationsParams = {}) {
    // Cree la requete de base pour recuperer les entrees de journalisation.
    const query = Journalisation.query()

    // Applique les filtres de module si fournis.
    if (module) {
      query.where('module', module)
    }

    // Applique les filtres de date si fournis.
    if (startDate && endDate) {
      const dateRange = normalizeDateRange(startDate, endDate)

      query.whereBetween('createdAt', [dateRange.startDate, dateRange.endDate])
    }

    // Le total est compté sur les filtres, puis la relation et le tri sont ajoutés au lot.
    return paginateBatch(
      query,
      {
        offset,
        limit,
        maxLimit: JOURNALISATIONS_MAX_BATCH,
        defaultLimit: JOURNALISATIONS_MAX_BATCH,
      },
      (batchQuery) =>
        batchQuery
          .preload('user', (userQuery) => {
            userQuery.select('id', 'fullName')
          })
          .orderBy('createdAt', 'desc')
    )
  }
}

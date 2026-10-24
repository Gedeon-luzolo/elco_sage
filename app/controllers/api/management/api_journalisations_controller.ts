import { JournalisationModule } from '#models/journalisation'
import JournalisationService from '#services/journalisation/journalisation_service'
import JournalisationTransformer from '#transformers/journalisation_transformer'
import { parseBatchParam } from '#utils/paginated_batch'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiJournalisationsController {
  constructor(private journalisationService: JournalisationService) {}

  /**
   * Journal des actions, filtrable par module et par période.
   */
  async index({ request, serialize }: HttpContext) {
    const module = request.input('module')

    // Les filtres sont optionnels : un module inconnu est ignoré

    const { items, pagination } = await this.journalisationService.findAllBatch({
      offset: parseBatchParam(request.input('offset')),
      limit: parseBatchParam(request.input('limit')),
      // Un module inconnu est ignore plutot que de provoquer une erreur.
      module: Object.values(JournalisationModule).includes(module) ? module : undefined,
      startDate: request.input('startDate'),
      endDate: request.input('endDate'),
    })

    return serialize({ items: JournalisationTransformer.transform(items), pagination })
  }
}

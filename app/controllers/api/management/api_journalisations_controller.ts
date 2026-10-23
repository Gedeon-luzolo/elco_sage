import { JournalisationModule } from '#models/journalisation'
import JournalisationService from '#services/journalisation/journalisation_service'
import JournalisationTransformer from '#transformers/journalisation_transformer'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiJournalisationsController {
  constructor(private journalisationService: JournalisationService) {}

  /**
   * Journal des actions, filtrable par module et par periode.
   */
  async index({ request, serialize }: HttpContext) {
    const module = request.input('module')

    const journalisations = await this.journalisationService.findAllBatch({
      // Un module inconnu est ignore plutot que de provoquer une erreur.
      module: Object.values(JournalisationModule).includes(module) ? module : undefined,
      startDate: request.input('startDate'),
      endDate: request.input('endDate'),
    })

    return serialize(JournalisationTransformer.transform(journalisations))
  }
}

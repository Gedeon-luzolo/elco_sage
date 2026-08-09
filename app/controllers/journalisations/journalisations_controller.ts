import { JournalisationModule } from '#models/journalisation'
import JournalisationService from '#services/journalisation/journalisation_service'
import JournalisationTransformer from '#transformers/journalisation_transformer'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class JournalisationsController {
  constructor(private journalisationService: JournalisationService) {}

  /**
   * Affiche le journal des actions du back-office.
   * Les filtres restent simples pour lire les derniers évènements par module et période.
   */
  async getJournalisations({ inertia, request }: HttpContext) {
    const module = request.input('module')
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')

    // Récupère les entrées de journalisation avec les filtres appliqués.
    const journalisations = await this.journalisationService.findAllBatch({
      module: this.normalizeModule(module),
      startDate,
      endDate,
    })

    // Rend la page journalisation avec les entrees et les filtres appliques.
    return inertia.render('journalisations/journalisations_page', {
      journalisations: JournalisationTransformer.transform(journalisations),
      filters: {
        module: this.normalizeModule(module) ?? 'ALL',
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      },
    })
  }

  // Ignore les modules inconnus pour éviter une erreur sur une URL modifiée à la main.
  private normalizeModule(module?: string) {
    if (!module || module === 'ALL') {
      return undefined
    }

    if (Object.values(JournalisationModule).includes(module as JournalisationModule)) {
      return module as JournalisationModule
    }

    return undefined
  }
}

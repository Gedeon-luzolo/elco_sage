import type {} from '../../../.adonisjs/server/pages.js'
import DashboardService from '#services/management/dashboard_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // Affiche le dashboard management sur la periode demandee.
  async index({ inertia, request }: HttpContext) {
    const overview = await this.dashboardService.getOverview({
      startDate: request.input('startDate'),
      endDate: request.input('endDate'),
    })

    return (inertia.render as any)('management/management', overview)
  }
}

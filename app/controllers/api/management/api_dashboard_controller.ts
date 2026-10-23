import DashboardService from '#services/management/dashboard_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiDashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * Vue d'ensemble du management sur la periode demandee.
   */
  async index({ request, serialize }: HttpContext) {
    return serialize(
      await this.dashboardService.getOverview({
        startDate: request.input('startDate'),
        endDate: request.input('endDate'),
      })
    )
  }
}

import ProductServiceService from '#services/products/product_service_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiProductServicesController {
  constructor(private productServiceService: ProductServiceService) {}

  /**
   * Services actifs vendables.
   * Donnée de référence mise en cache hors ligne par la SPA.
   */
  async activeForSale({ serialize }: HttpContext) {
    return serialize(await this.productServiceService.getActiveServicesForSale())
  }
}

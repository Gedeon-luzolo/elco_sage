import ProductServiceService from '#services/products/product_service_service'
import ProductServiceTransformer from '#transformers/product_service_transformer'
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
    const services = await this.productServiceService.getActiveServicesForSale()

    return serialize(ProductServiceTransformer.transform(services))
  }
}

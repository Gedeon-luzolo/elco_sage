import ProductServiceService from '#services/products/product_service_service'
import ProductServiceTransformer from '#transformers/product_service_transformer'
import { todayDateKey } from '#utils/date_utils'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiProductServicesController {
  constructor(private productServiceService: ProductServiceService) {}

  /**
   * Services actifs vendables avec leur disponibilite de stock a la date metier demandee.
   * Donnee de reference mise en cache hors ligne : la SPA y controle le stock localement.
   */
  async activeForSale({ request, serialize }: HttpContext) {
    const services = await this.productServiceService.getActiveServicesForSale(
      request.input('date', todayDateKey())
    )

    return serialize(ProductServiceTransformer.transform(services))
  }
}

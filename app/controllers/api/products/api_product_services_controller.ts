import ProductServiceService from '#services/products/product_service_service'
import ProductServiceTransformer from '#transformers/product_service_transformer'
import { todayDateKey } from '#utils/date_utils'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiProductServicesController {
  constructor(private productServiceService: ProductServiceService) {}

  /**
   * Services actifs vendables avec leur disponibilité de stock à la date métier demandée.
   * Donnée de référence mise en cache hors ligne : la SPA y contrôle le stock localement.
   */
  async activeForSale({ request, serialize }: HttpContext) {
    // Sans date, le stock est celui du jour métier
    const services = await this.productServiceService.getActiveServicesForSale(
      request.input('date', todayDateKey())
    )

    return serialize(ProductServiceTransformer.transform(services))
  }
}

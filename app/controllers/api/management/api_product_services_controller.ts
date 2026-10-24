import ProductCategoryService from '#services/categories/product_category_service'
import ProductServiceService from '#services/products/product_service_service'
import { apiAction } from '#utils/api_action'
import {
  createProductServiceValidator,
  updateProductServiceValidator,
} from '#validators/product_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiProductServicesAdminController {
  constructor(
    private productServiceService: ProductServiceService,
    private productCategoryService: ProductCategoryService
  ) {}

  /**
   * Catalogue complet : produits, services, statistiques et catégories actives.
   */
  async index({ serialize }: HttpContext) {
    // Catalogue et catégories sont chargés ensemble pour l'écran d'administration
    const overview = await this.productServiceService.getOverview()
    const categories = await this.productCategoryService.getActiveCategories()

    return serialize({
      products: overview.products,
      services: overview.services,
      stats: overview.stats,
      categories,
    })
  }

  /**
   * Crée un produit ou un service.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createProductServiceValidator)

    return apiAction(ctx, async () => {
      const item = await this.productServiceService.create(actor, payload)

      return ctx.response.created(await ctx.serialize({ id: item.id }))
    })
  }

  /**
   * Modifie un produit ou un service.
   */
  async update(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(updateProductServiceValidator)

    return apiAction(ctx, async () => {
      await this.productServiceService.update(actor, ctx.params.id, payload)

      return ctx.response.noContent()
    })
  }
}

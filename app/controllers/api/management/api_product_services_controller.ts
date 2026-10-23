import ProductCategoryService from '#services/categories/product_category_service'
import ProductServiceService from '#services/products/product_service_service'
import ProductCategoryTransformer from '#transformers/product_category_transformer'
import ProductServiceTransformer from '#transformers/product_service_transformer'
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
   * Catalogue complet : produits, services, statistiques et categories actives.
   */
  async index({ serialize }: HttpContext) {
    const overview = await this.productServiceService.getOverview()
    const categories = await this.productCategoryService.getActiveCategories()

    return serialize({
      products: ProductServiceTransformer.transform(overview.products),
      services: ProductServiceTransformer.transform(overview.services),
      stats: overview.stats,
      categories: ProductCategoryTransformer.transform(categories),
    })
  }

  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createProductServiceValidator)

    return apiAction(ctx, async () => {
      const item = await this.productServiceService.create(actor, payload)

      return ctx.response.created(await ctx.serialize({ id: item.id }))
    })
  }

  async update(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(updateProductServiceValidator)

    return apiAction(ctx, async () => {
      await this.productServiceService.update(actor, ctx.params.id, payload)

      return ctx.response.noContent()
    })
  }

  async destroy(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    return apiAction(ctx, async () => {
      await this.productServiceService.delete(actor, ctx.params.id)

      return ctx.response.noContent()
    })
  }
}

import ProductCategoryService from '#services/categories/product_category_service'
import ProductCategoryTransformer from '#transformers/product_category_transformer'
import { apiAction } from '#utils/api_action'
import {
  createProductCategoryValidator,
  updateProductCategoryValidator,
} from '#validators/product_category'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ApiProductCategoriesController {
  constructor(private categoryService: ProductCategoryService) {}

  async index({ serialize }: HttpContext) {
    const overview = await this.categoryService.getCategoriesOverview()

    return serialize({
      categories: ProductCategoryTransformer.transform(overview.categories),
      stats: overview.stats,
    })
  }

  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createProductCategoryValidator)

    return apiAction(ctx, async () => {
      const category = await this.categoryService.create(actor, payload)

      return ctx.response.created(
        await ctx.serialize(ProductCategoryTransformer.transformSingle(category))
      )
    })
  }

  async update(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(updateProductCategoryValidator)

    return apiAction(ctx, async () => {
      await this.categoryService.update(actor, ctx.params.id, payload)

      return ctx.response.noContent()
    })
  }

  async destroy(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    return apiAction(ctx, async () => {
      await this.categoryService.delete(actor, ctx.params.id)

      return ctx.response.noContent()
    })
  }
}

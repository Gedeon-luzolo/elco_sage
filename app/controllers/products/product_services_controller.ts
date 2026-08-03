import type {} from '../../../.adonisjs/server/pages.d.ts'
import ProductServiceService from '#services/products/product_service_service'
import ProductServiceTransformer from '#transformers/product_service_transformer'
import ProductCategoryTransformer from '#transformers/product_category_transformer'
import ProductCategory from '#models/product_category'
import { runAction } from '#utils/error_handler'
import {
  createProductServiceValidator,
  updateProductServiceValidator,
} from '#validators/product_service'
import type { HttpContext } from '@adonisjs/core/http'

const productServiceService = new ProductServiceService()

// URL de redirection commune après toute mutation réussie.
const REDIRECT_URL = '/management/product-services'

export default class ProductServicesController {
  /**
   * Affiche la liste des produits et services.
   */
  async index({ inertia }: HttpContext) {
    const overview = await productServiceService.getOverview()
    const categories = await ProductCategory.query().where('is_active', true).orderBy('name', 'asc')

    return (inertia.render as any)('products/product_services_page', {
      products: ProductServiceTransformer.transform(overview.products),
      services: ProductServiceTransformer.transform(overview.services),
      stats: overview.stats,
      categories: ProductCategoryTransformer.transform(categories),
    })
  }

  /**
   * Crée un nouveau produit ou service.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createProductServiceValidator)

    return runAction(
      ctx,
      () => productServiceService.create(actor, payload),
      {
        successMessage: (item) => `"${item.name}" créé avec succès.`,
        errorMessage: 'Impossible de créer cet article.',
        redirectTo: REDIRECT_URL,
      }
    )
  }

  /**
   * Met à jour un produit ou service existant.
   */
  async update(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(updateProductServiceValidator)

    return runAction(
      ctx,
      () => productServiceService.update(actor, ctx.params.id, payload),
      {
        successMessage: '"${payload.name}" mis à jour avec succès.',
        errorMessage: 'Impossible de mettre à jour cet article.',
        redirectTo: REDIRECT_URL,
      }
    )
  }

  /**
   * Supprime un produit ou service.
   */
  async destroy(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    return runAction(
      ctx,
      () => productServiceService.delete(actor, ctx.params.id),
      {
        successMessage: 'Article supprimé.',
        errorMessage: 'Suppression impossible.',
        redirectTo: REDIRECT_URL,
      }
    )
  }
}

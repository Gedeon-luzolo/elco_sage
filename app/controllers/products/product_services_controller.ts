import type {} from '../../../.adonisjs/server/pages.d.ts'
import ProductCategory from '#models/product_category'
import ProductServiceService from '#services/products/product_service_service'
import ProductCategoryTransformer from '#transformers/product_category_transformer'
import ProductServiceTransformer from '#transformers/product_service_transformer'
import { runAction } from '#utils/error_handler'
import {
  createProductServiceValidator,
  updateProductServiceValidator,
} from '#validators/product_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

// URL de redirection commune après toute mutation réussie.
const REDIRECT_URL = '/management/product-services'

@inject()
export default class ProductServicesController {
  constructor(private productServiceService: ProductServiceService) {}

  /**
   * Affiche la liste des produits et services.
   */
  async index({ inertia }: HttpContext) {
    const overview = await this.productServiceService.getOverview()
    const categories = await ProductCategory.query().where('is_active', true).orderBy('name', 'asc')

    return (inertia.render as any)('products/product_services_page', {
      products: ProductServiceTransformer.transform(overview.products),
      services: ProductServiceTransformer.transform(overview.services),
      stats: overview.stats,
      categories: ProductCategoryTransformer.transform(categories),
    })
  }

  /**
   * Retourne uniquement les services actifs disponibles a la vente.
   */
  async activeForSale({ response }: HttpContext) {
    // Le module vente consomme seulement les prestations actives.
    const services = await this.productServiceService.getActiveServicesForSale()

    return response.ok({
      services: ProductServiceTransformer.transform(services),
    })
  }

  /**
   * Cree un nouveau produit ou service.
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createProductServiceValidator)

    return runAction(ctx, () => this.productServiceService.create(actor, payload), {
      successMessage: (item) => `"${item.name}" créé avec succès.`,
      errorMessage: 'Impossible de créer cet article.',
      redirectTo: REDIRECT_URL,
    })
  }

  /**
   * Met à jour un produit ou service existant.
   */
  async update(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(updateProductServiceValidator)

    return runAction(ctx, () => this.productServiceService.update(actor, ctx.params.id, payload), {
      successMessage: '"${payload.name}" mis à jour avec succès.',
      errorMessage: 'Impossible de mettre à jour cet article.',
      redirectTo: REDIRECT_URL,
    })
  }

  /**
   * Supprime un produit ou service.
   */
  async destroy(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()

    return runAction(ctx, () => this.productServiceService.delete(actor, ctx.params.id), {
      successMessage: 'Article supprimé.',
      errorMessage: 'Suppression impossible.',
      redirectTo: REDIRECT_URL,
    })
  }
}

import type {} from '../../../.adonisjs/server/pages.d.ts'
import ProductCategoryService from '#services/categories/product_category_service'
import ProductCategoryTransformer from '#transformers/product_category_transformer'
import { runAction } from '#utils/error_handler'
import {
  createProductCategoryValidator,
  updateProductCategoryValidator,
} from '#validators/product_category'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

// URL de redirection commune après toute mutation réussie sur les catégories.
const REDIRECT_URL = '/management/product-categories'

@inject()
export default class ProductCategoriesController {
  constructor(private categoryService: ProductCategoryService) {}

  /**
   * Affiche la liste des catégories de services/produits.
   */
  async index({ inertia }: HttpContext) {
    // Récupère les catégories et les statistiques depuis le service.
    const overview = await this.categoryService.getCategoriesOverview()

    return (inertia.render as any)('categories/product_categories_page', {
      // Transforme les modèles Lucid en DTO sérialisables pour Inertia.
      categories: ProductCategoryTransformer.transform(overview.categories),
      stats: overview.stats,
    })
  }

  /**
   * Crée une nouvelle catégorie.
   */
  async store(ctx: HttpContext) {
    // Le middleware auth garantit que l'utilisateur est connecté avant d'arriver ici.
    const actor = ctx.auth.getUserOrFail()

    // Valide et extrait les champs du corps de la requête.
    const payload = await ctx.request.validateUsing(createProductCategoryValidator)

    // Délègue la création au service et gère le flash + la redirection via le helper.
    return runAction(ctx, () => this.categoryService.create(actor, payload), {
      // Le nom de la catégorie est disponible dans le résultat du service.
      successMessage: (category) => `Catégorie "${category.name}" créée avec succès.`,
      errorMessage: 'Impossible de créer la catégorie.',
      redirectTo: REDIRECT_URL,
    })
  }

  /**
   * Met à jour une catégorie existante.
   */
  async update(ctx: HttpContext) {
    // Le middleware auth garantit que l'utilisateur est connecté avant d'arriver ici.
    const actor = ctx.auth.getUserOrFail()

    // Valide les champs modifiables (nom et statut).
    const payload = await ctx.request.validateUsing(updateProductCategoryValidator)

    // Délègue la mise à jour au service en passant l'ID extrait de l'URL.
    return runAction(ctx, () => this.categoryService.update(actor, ctx.params.id, payload), {
      successMessage: 'Catégorie mise à jour avec succès.',
      errorMessage: 'Impossible de mettre à jour la catégorie.',
      redirectTo: REDIRECT_URL,
    })
  }

  /**
   * Supprime une catégorie.
   */
  async destroy(ctx: HttpContext) {
    // Le middleware auth garantit que l'utilisateur est connecté avant d'arriver ici.
    const actor = ctx.auth.getUserOrFail()

    // La suppression est définitive, la journalisation est gérée dans le service.
    return runAction(ctx, () => this.categoryService.delete(actor, ctx.params.id), {
      successMessage: 'Catégorie supprimée.',
      errorMessage: 'Suppression de la catégorie impossible.',
      redirectTo: REDIRECT_URL,
    })
  }
}

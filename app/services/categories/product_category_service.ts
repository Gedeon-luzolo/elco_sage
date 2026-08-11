import ProductCategory from '#models/product_category'
import { JournalisationModule } from '#models/journalisation'
import type User from '#models/user'
import { CacheKeys, CacheTtl } from '#services/cache/cache_keys'
import CacheService from '#services/cache/cache_service'
import JournalisationService from '#services/journalisation/journalisation_service'
import type {
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '#validators/product_category'
import { inject } from '@adonisjs/core'

@inject()
export default class ProductCategoryService {
  constructor(
    private journalisationService: JournalisationService,
    private cacheService: CacheService
  ) {}

  /**
   * Récupère la liste des catégories et des statistiques générales.
   */
  async getCategoriesOverview() {
    // On utilise un cache d'une durée plus longue pour les catégories, car elles changent rarement.
    return this.cacheService.remember(
      CacheKeys.productCategories.overview,
      CacheTtl.ONE_MONTH,
      async () => {
        const categories = await ProductCategory.query().orderBy('name', 'asc')

        const total = categories.length
        const activeCount = categories.filter((c) => c.isActive).length
        const inactiveCount = total - activeCount

        return {
          categories,
          stats: {
            total,
            activeCount,
            inactiveCount,
          },
        }
      }
    )
  }

  // Récupère la liste des catégories actives pour les produits/services vendables.
  async getActiveCategories() {
    return this.cacheService.remember(CacheKeys.productCategories.active, CacheTtl.ONE_MONTH, () =>
      ProductCategory.query().where('is_active', true).orderBy('name', 'asc')
    )
  }

  /**
   * Crée une nouvelle catégorie de produits/services.
   */
  async create(actor: User, payload: CreateProductCategoryInput) {
    const category = await ProductCategory.create({
      name: payload.name,
      // Le statut est toujours initialisé à true à la création — le payload ne le contient pas.
      isActive: true,
    })

    await this.journalisationService.create({
      module: JournalisationModule.PRODUCT_CATEGORIES,
      message: `La catégorie de service "${category.name}" a été créée par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    this.invalidateCategoryCache()

    return category
  }

  /**
   * Modifie une catégorie existante.
   */
  async update(actor: User, id: string, payload: UpdateProductCategoryInput) {
    const category = await ProductCategory.findOrFail(id)

    // Vérification de l'unicité du nom si modifié
    if (payload.name !== category.name) {
      const existing = await ProductCategory.query()
        .where('name', payload.name)
        .whereNot('id', id)
        .first()

      // Refuser si ça exsite
      if (existing) {
        throw new Error('Une catégorie portant ce nom existe déjà.')
      }
    }

    const previousName = category.name
    category.name = payload.name
    // isActive est obligatoire dans le payload d'édition — on l'applique directement.
    category.isActive = Boolean(payload.isActive)

    await category.save()

    await this.journalisationService.create({
      module: JournalisationModule.PRODUCT_CATEGORIES,
      message: `La catégorie "${previousName}" a été mise à jour par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    this.invalidateCategoryCache()

    return category
  }

  /**
   * Supprime une catégorie.
   */
  async delete(actor: User, id: string) {
    const category = await ProductCategory.findOrFail(id)
    const categoryName = category.name

    // Supprimer la categorie
    await category.delete()

    // Créer une notification
    await this.journalisationService.create({
      module: JournalisationModule.PRODUCT_CATEGORIES,
      message: `La catégorie "${categoryName}" a été supprimée par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    this.invalidateCategoryCache()

    return true
  }

  // Invalide le cache des catégories et services pour forcer la lecture depuis la base de données.
  private invalidateCategoryCache() {
    this.cacheService.forgetByPrefix(CacheKeys.productCategories.prefix)
    this.cacheService.forgetByPrefix(CacheKeys.productServices.prefix)
  }
}

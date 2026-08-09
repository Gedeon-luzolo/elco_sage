import ProductCategory from '#models/product_category'
import { JournalisationModule } from '#models/journalisation'
import type User from '#models/user'
import JournalisationService from '#services/journalisation/journalisation_service'
import type {
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '#validators/product_category'
import { inject } from '@adonisjs/core'

@inject()
export default class ProductCategoryService {
  constructor(private journalisationService: JournalisationService) {}

  /**
   * Récupère la liste des catégories et des statistiques générales.
   */
  async getCategoriesOverview() {
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

  /**
   * Crée une nouvelle catégorie de produits/services.
   */
  async create(actor: User, payload: CreateProductCategoryInput) {
    const category = await ProductCategory.create({
      name: payload.name,
      description: payload.description ?? null,
      // Le statut est toujours initialisé à true à la création — le payload ne le contient pas.
      isActive: true,
    })

    await this.journalisationService.create({
      module: JournalisationModule.PRODUCT_CATEGORIES,
      message: `La catégorie de service "${category.name}" a été créée par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

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
    category.description = payload.description ?? null
    // isActive est obligatoire dans le payload d'édition — on l'applique directement.
    category.isActive = Boolean(payload.isActive)

    await category.save()

    await this.journalisationService.create({
      module: JournalisationModule.PRODUCT_CATEGORIES,
      message: `La catégorie "${previousName}" a été mise à jour par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

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

    return true
  }
}

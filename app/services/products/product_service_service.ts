import ProductService from '#models/product_service'
import { JournalisationModule } from '#models/journalisation'
import type User from '#models/user'
import JournalisationService from '#services/journalisation/journalisation_service'
import ExchangeRateService from '#services/exchange_rates/exchange_rate_service'
import { Currency } from '#types/currency'
import type {
  CreateProductServiceInput,
  UpdateProductServiceInput,
} from '#validators/product_service'

const journalisationService = new JournalisationService()
const exchangeRateService = new ExchangeRateService()

export default class ProductServiceService {
  /**
   * Récupère la liste des produits/services et les statistiques.
   */
  async getOverview() {
    // Recuperer d'abord les produits et les services
    const items = await ProductService.query().preload('category').orderBy('name', 'asc')

    // Separer les produits et les services
    const products = items.filter((i) => i.type === 'PRODUCT')
    const services = items.filter((i) => i.type === 'SERVICE')

    // Compter les produits et les services
    const productCount = products.length
    const serviceCount = services.length
    const total = items.length
    const activeCount = items.filter((i) => i.isActive).length

    return {
      products,
      services,
      stats: {
        total,
        activeCount,
        inactiveCount: total - activeCount,
        productCount,
        serviceCount,
      },
    }
  }

  /**
   * Calcule priceUsd et priceCdf à partir du montant et de la devise renseignés.
   */
  private async calculatePrices(priceInput: number, currency: Currency) {
    // Convertir le prix en nombre
    const amount = Number(priceInput)

    // Convertir le prix en USD et CDF
    if (currency === Currency.USD) {
      const priceCdf = await exchangeRateService.convertUsdToCdf(amount, 'sell')
      return { priceUsd: amount, priceCdf }
      // Convertir  en franc
    } else {
      const priceUsd = await exchangeRateService.convertCdfToUsd(amount, 'sell')
      return { priceUsd, priceCdf: amount }
    }
  }

  /**
   * Crée un nouveau produit ou service avec conversion automatique du prix.
   */
  async create(actor: User, payload: CreateProductServiceInput) {
    const existing = await ProductService.query().where('name', payload.name).first()
    // Vérifier si le produit ou service existe
    if (existing) {
      throw new Error('Un article portant ce nom existe déjà.')
    }

    // Calculer les prix
    const { priceUsd, priceCdf } = await this.calculatePrices(
      Number(payload.price),
      payload.currency as Currency
    )
    // Creer le produit ou service
    const item = await ProductService.create({
      type: payload.type as any,
      name: payload.name,
      categoryId: payload.categoryId ?? null,
      isActive: true,
      baseUnit: payload.baseUnit,
      packagingUnit: payload.packagingUnit ?? null,
      packagingCapacity:
        payload.packagingCapacity != null ? Number(payload.packagingCapacity) : null,
      priceUsd,
      priceCdf,
    })

    // Enregistrer la journalisation
    await journalisationService.create({
      module: JournalisationModule.PRODUCT_SERVICES,
      message: `Le produit/service "${item.name}" a été créé par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    return item
  }

  /**
   * Modifie un produit ou service existant et recalcule ses prix.
   */
  async update(actor: User, id: string, payload: UpdateProductServiceInput) {
    const item = await ProductService.findOrFail(id)

    // Si le nom a été modifié, vérifier s'il existe déjà
    if (payload.name !== item.name) {
      const existing = await ProductService.query()
        .where('name', payload.name)
        .whereNot('id', id)
        .first()

      // Si le nom existe deja alors
      if (existing) {
        throw new Error('Un article portant ce nom existe déjà.')
      }
    }

    // Appliquer le calccul de prix
    const { priceUsd, priceCdf } = await this.calculatePrices(
      Number(payload.price),
      payload.currency as Currency
    )

    const previousName = item.name
    item.type = payload.type as any
    item.name = payload.name
    item.categoryId = payload.categoryId ?? null
    item.baseUnit = payload.baseUnit
    item.packagingUnit = payload.packagingUnit ?? null
    item.packagingCapacity =
      payload.packagingCapacity != null ? Number(payload.packagingCapacity) : null
    item.priceUsd = priceUsd
    item.priceCdf = priceCdf
    item.isActive = Boolean(payload.isActive)

    await item.save()

    // Enregistrer la journalisation
    await journalisationService.create({
      module: JournalisationModule.PRODUCT_SERVICES,
      message: `Le produit/service "${previousName}" a été mis à jour par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    return item
  }

  /**
   * Supprime un produit ou service.
   */
  async delete(actor: User, id: string) {
    const item = await ProductService.findOrFail(id)
    const itemName = item.name

    await item.delete()

    await journalisationService.create({
      module: JournalisationModule.PRODUCT_SERVICES,
      message: `Le produit/service "${itemName}" a été supprimé par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    return true
  }
}

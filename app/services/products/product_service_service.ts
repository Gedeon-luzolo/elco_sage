import ProductService, { ProductServiceType } from '#models/product_service'
import { JournalisationModule } from '#models/journalisation'
import type User from '#models/user'
import { CacheKeys, CacheTtl } from '#services/cache/cache_keys'
import CacheService from '#services/cache/cache_service'
import JournalisationService from '#services/journalisation/journalisation_service'
import ExchangeRateService from '#services/exchange_rates/exchange_rate_service'
import StockMovementService, {
  type SaleStockSnapshot,
} from '#services/stock/stock_movement_service'
import { Currency } from '#types/currency'
import { todayDateKey } from '#utils/date_utils'
import type {
  CreateProductServiceInput,
  UpdateProductServiceInput,
} from '#validators/product_service'
import { inject } from '@adonisjs/core'

export type ProductServiceWithSaleStock = ProductService & {
  saleStockSnapshot?: SaleStockSnapshot | null
}

@inject()
export default class ProductServiceService {
  constructor(
    private journalisationService: JournalisationService,
    private exchangeRateService: ExchangeRateService,
    private stockMovementService: StockMovementService,
    private cacheService: CacheService
  ) {}

  /**
   * Récupère la liste des produits/services et les statistiques.
   */
  async getOverview() {
    return this.cacheService.remember(CacheKeys.productServices.overview, CacheTtl.ONE_MONTH, () =>
      this.buildOverview()
    )
  }

  private async buildOverview() {
    // Recuperer d'abord les produits et les services avec leurs relations d'affichage.
    const items = await ProductService.query()
      .preload('category')
      .preload('stockProduct')
      .orderBy('name', 'asc')

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
   * Recupere uniquement les services actifs disponibles a la vente.
   */
  async getActiveServicesForSale(stockDate = todayDateKey()) {
    return this.cacheService.remember(
      CacheKeys.productServices.activeForSale(stockDate),
      CacheTtl.MEDIUM,
      () => this.buildActiveServicesForSale(stockDate)
    )
  }

  private async buildActiveServicesForSale(stockDate: string) {
    // Le module vente ne vend pas les produits physiques, uniquement les prestations.
    const services = await ProductService.query()
      .where('type', ProductServiceType.SERVICE)
      .where('isActive', true)
      .preload('category')
      .preload('stockProduct')
      .orderBy('name', 'asc')

    // Le formulaire de vente doit afficher le stock du produit consomme par chaque service.
    for (const service of services as ProductServiceWithSaleStock[]) {
      // Un service bien configuré pointe vers le produit physique qui sera décrémenté à la vente.
      service.saleStockSnapshot = service.stockProduct
        ? await this.stockMovementService.getSaleStockSnapshot(service.stockProduct, stockDate)
        : {
            productId: service.id,
            availableStock: 0,
            canSell: false,
            blockingReason: `Le service "${service.name}" n'est pas lie a un produit de stock.`,
          }
    }

    return services
  }

  /**
   * Calcule priceUsd et priceCdf à partir du montant et de la devise renseignés.
   */
  private async calculatePrices(priceInput: number, currency: Currency) {
    const amount = Number(priceInput)

    // Si le prix est en USD, on convertit uniquement vers CDF
    if (currency === Currency.USD) {
      const priceCdf = await this.exchangeRateService.convertUsdToCdf(amount, 'buy')
      return { priceUsd: amount, priceCdf }
    }

    // Si le prix est en CDF, on convertit uniquement vers USD
    const priceUsd = await this.exchangeRateService.convertCdfToUsd(amount, 'buy')
    return { priceUsd, priceCdf: amount }
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
    // Pour un service, on valide ici le produit consommé avant de créer l'article.
    const stockProductId = await this.resolveStockProductId(payload.type, payload.stockProductId)
    const baseUnit = this.resolveBaseUnit(payload.type, payload.baseUnit)

    // Creer le produit ou service
    const item = await ProductService.create({
      type: payload.type as any,
      name: payload.name,
      categoryId: payload.categoryId ?? null,
      stockProductId,
      isActive: true,
      baseUnit,
      packagingUnit: payload.packagingUnit ?? null,
      packagingCapacity:
        payload.packagingCapacity !== null && payload.packagingCapacity !== undefined
          ? Number(payload.packagingCapacity)
          : null,
      priceUsd,
      priceCdf,
    })

    // Enregistrer la journalisation
    await this.journalisationService.create({
      module: JournalisationModule.PRODUCT_SERVICES,
      message: `Le produit/service "${item.name}" a été créé par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    // Invalider le cache pour forcer la lecture depuis la base de données
    this.invalidateProductServiceCache()

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
    // Si l'article devient un produit, le lien stock est nettoyé; si c'est un service, il est obligatoire.
    const stockProductId = await this.resolveStockProductId(payload.type, payload.stockProductId)
    const baseUnit = this.resolveBaseUnit(payload.type, payload.baseUnit)

    const previousName = item.name
    item.type = payload.type as any
    item.name = payload.name
    item.categoryId = payload.categoryId ?? null
    item.stockProductId = stockProductId
    item.baseUnit = baseUnit
    item.packagingUnit = payload.packagingUnit ?? null
    item.packagingCapacity =
      payload.packagingCapacity !== null && payload.packagingCapacity !== undefined
        ? Number(payload.packagingCapacity)
        : null
    item.priceUsd = priceUsd
    item.priceCdf = priceCdf
    item.isActive = Boolean(payload.isActive)

    await item.save()

    // Enregistrer la journalisation
    await this.journalisationService.create({
      module: JournalisationModule.PRODUCT_SERVICES,
      message: `Le produit/service "${previousName}" a été mis à jour par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    this.invalidateProductServiceCache()

    return item
  }

  /**
   * Supprime un produit ou service.
   */
  async delete(actor: User, id: string) {
    const item = await ProductService.findOrFail(id)
    const itemName = item.name

    await item.delete()

    await this.journalisationService.create({
      module: JournalisationModule.PRODUCT_SERVICES,
      message: `Le produit/service "${itemName}" a été supprimé par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    // Invalider le cache pour forcer la lecture depuis la base de données
    this.invalidateProductServiceCache()

    return true
  }

  // Invalide le cache des produits et services pour forcer la lecture depuis la base de données.
  private invalidateProductServiceCache() {
    this.cacheService.forgetByPrefix(CacheKeys.productServices.prefix)
    this.cacheService.forgetByPrefix(CacheKeys.stock.prefix)
  }

  /**
   * Determine le produit physique consomme par un service.
   */
  private async resolveStockProductId(type: string, stockProductId?: string | null) {
    // Les produits physiques alimentent le stock, ils ne doivent pas pointer vers eux-memes.
    if (type === ProductServiceType.PRODUCT) {
      return null
    }

    // Un service vendable doit savoir quel produit physique il consomme.
    if (!stockProductId) {
      throw new Error('Selectionnez le produit de stock consomme par ce service.')
    }

    // Un service doit toujours consommer un article physique actif.
    const product = await ProductService.query()
      .where('id', stockProductId)
      .where('type', ProductServiceType.PRODUCT)
      .where('isActive', true)
      .first()

    if (!product) {
      throw new Error('Le produit de stock selectionne est invalide ou inactif.')
    }

    return product.id
  }

  /**
   * Determine l'unite de base stockee selon le type d'article.
   */
  private resolveBaseUnit(type: string, baseUnit?: string | null) {
    // Les services consomment l'unite de base du produit lie, donc leur propre unite est inutile.
    if (type === ProductServiceType.SERVICE) {
      return null
    }

    if (!baseUnit) {
      throw new Error("Renseignez l'unite de base du produit.")
    }

    return baseUnit
  }
}

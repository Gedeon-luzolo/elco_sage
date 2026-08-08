import ProductService, { ProductServiceType } from '#models/product_service'
import SaleItem from '#models/sale_item'
import StockMovementService from '#services/stock/stock_movement_service'
import type { Currency } from '#types/currency'
import type {
  CreateSaleItemInput,
  PreparedSaleItemInput,
  PreparedSaleItemsResult,
} from '#types/sales'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

const stockMovementService = new StockMovementService()

export default class SaleItemService {
  /**
   * Prepare les lignes d'une vente a partir des services vendables.
   */
  async prepareItems(
    items: CreateSaleItemInput[],
    currency: Currency
  ): Promise<PreparedSaleItemsResult> {
    if (items.length === 0) {
      throw new Error('Ajoutez au moins un service a la vente.')
    }

    // Evite deux lignes pour le meme service dans une seule vente.
    this.ensureNoDuplicateServices(items)

    // On recharge les services côté serveur pour ne jamais faire confiance aux prix envoyés par le frontend.
    const serviceIds = items.map((item) => item.productServiceId)
    const services = await ProductService.query()
      .whereIn('id', serviceIds)
      .where('type', ProductServiceType.SERVICE)
      .where('isActive', true)
      .preload('stockProduct')

    // Tous les ids envoyes doivent correspondre a des services actifs.
    if (services.length !== serviceIds.length) {
      throw new Error('Un ou plusieurs services selectionnes sont invalides ou inactifs.')
    }

    const servicesById = new Map(services.map((service) => [service.id, service]))
    const preparedItems = items.map((item) => {
      const service = servicesById.get(item.productServiceId)!
      const quantity = Number(item.quantity)

      if (quantity <= 0) {
        throw new Error('La quantité de chaque ligne doit etre superieure a zéro.')
      }

      // Sans produit consommé, on ne peut pas traduire la vente en sortie de stock.
      if (!service.stockProduct) {
        throw new Error(`Le service "${service.name}" n'est pas lié a un produit de stock.`)
      }

      // Le prix vient toujours du service pour eviter une manipulation cote client.
      const unitPrice = currency === 'USD' ? service.priceUsd : service.priceCdf
      const totalPrice = unitPrice * quantity

      return {
        orderNumber: item.orderNumber.trim(),
        productServiceId: service.id,
        stockProduct: service.stockProduct,
        quantity,
        currency,
        unitPrice,
        totalPrice,
      }
    })

    // Le total de l'entete est derive uniquement des lignes preparees.
    const theoreticalAmount = preparedItems.reduce((sum, item) => sum + item.totalPrice, 0)

    return { items: preparedItems, theoreticalAmount }
  }

  /**
   * Cree les lignes d'une vente dans la transaction courante.
   */
  async createManyForSale(
    saleId: string,
    items: PreparedSaleItemInput[],
    trx?: TransactionClientContract
  ) {
    const rows = items.map((item) => ({
      saleId,
      orderNumber: item.orderNumber,
      productServiceId: item.productServiceId,
      quantity: item.quantity,
      currency: item.currency,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }))

    // Les lignes sont creees en batch pour garder la creation de vente compacte.
    return SaleItem.createMany(rows, trx ? { client: trx } : undefined)
  }

  /**
   * Impute les sorties de stock consommees par les lignes de vente.
   */
  async consumeStockForSale(
    items: PreparedSaleItemInput[],
    date: string,
    trx: TransactionClientContract
  ) {
    // Plusieurs services peuvent consommer le même produit, ex: impression A4 N/B et couleur.
    const quantitiesByProduct = new Map<string, { product: ProductService; quantity: number }>()

    // Regroupe les services qui consomment le meme produit pour valider le stock une seule fois.
    for (const item of items) {
      const current = quantitiesByProduct.get(item.stockProduct.id)

      quantitiesByProduct.set(item.stockProduct.id, {
        product: item.stockProduct,
        quantity: (current?.quantity ?? 0) + item.quantity,
      })
    }

    // Chaque produit est débité une seule fois, dans la transaction de vente.
    for (const { product, quantity } of quantitiesByProduct.values()) {
      await stockMovementService.consumeForSale(product, quantity, date, trx)
    }
  }

  /**
   * Retire les sorties de stock quand une vente est annulee.
   */
  async restoreStockForCancelledSale(
    items: PreparedSaleItemInput[],
    date: string,
    trx: TransactionClientContract
  ) {
    // On applique la même agrégation qu'à la création pour annuler exactement les sorties.
    const quantitiesByProduct = new Map<string, { product: ProductService; quantity: number }>()

    // Regroupe les lignes par produit physique pour eviter plusieurs corrections sur le meme mouvement.
    for (const item of items) {
      const current = quantitiesByProduct.get(item.stockProduct.id)

      quantitiesByProduct.set(item.stockProduct.id, {
        product: item.stockProduct,
        quantity: (current?.quantity ?? 0) + item.quantity,
      })
    }

    // La restauration reste transactionnelle avec l'annulation de la vente.
    for (const { product, quantity } of quantitiesByProduct.values()) {
      await stockMovementService.restoreForCancelledSale(product, quantity, date, trx)
    }
  }

  // Verifie que la meme prestation n'est pas envoyee plusieurs fois.
  private ensureNoDuplicateServices(items: CreateSaleItemInput[]) {
    const uniqueIds = new Set(items.map((item) => item.productServiceId))

    if (uniqueIds.size !== items.length) {
      throw new Error('Un service ne peut pas etre ajoute plusieurs fois dans la meme vente.')
    }
  }
}

import ProductService, { ProductServiceType } from '#models/product_service'
import SaleItem from '#models/sale_item'
import type { Currency } from '#types/currency'
import type {
  CreateSaleItemInput,
  PreparedSaleItemInput,
  PreparedSaleItemsResult,
} from '#types/sales'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

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

    const serviceIds = items.map((item) => item.productServiceId)
    const services = await ProductService.query()
      .whereIn('id', serviceIds)
      .where('type', ProductServiceType.SERVICE)
      .where('isActive', true)

    // Tous les ids envoyes doivent correspondre a des services actifs.
    if (services.length !== serviceIds.length) {
      throw new Error('Un ou plusieurs services selectionnes sont invalides ou inactifs.')
    }

    const servicesById = new Map(services.map((service) => [service.id, service]))
    const preparedItems = items.map((item) => {
      const service = servicesById.get(item.productServiceId)!
      const quantity = Number(item.quantity)

      if (quantity <= 0) {
        throw new Error('La quantite de chaque ligne doit etre superieure a zero.')
      }

      // Le prix vient toujours du service pour eviter une manipulation cote client.
      const unitPrice = currency === 'USD' ? service.priceUsd : service.priceCdf
      const totalPrice = unitPrice * quantity

      return {
        orderNumber: item.orderNumber.trim(),
        productServiceId: service.id,
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

  // Verifie que la meme prestation n'est pas envoyee plusieurs fois.
  private ensureNoDuplicateServices(items: CreateSaleItemInput[]) {
    const uniqueIds = new Set(items.map((item) => item.productServiceId))

    if (uniqueIds.size !== items.length) {
      throw new Error('Un service ne peut pas etre ajoute plusieurs fois dans la meme vente.')
    }
  }
}
